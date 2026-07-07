import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock dependencies ───────────────────────────────────────────────────────
const mockFrom = vi.fn();
const mockAuthGetUser = vi.fn();
const mockCanManageAssets = vi.fn().mockReturnValue(true);

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
    auth: { getUser: mockAuthGetUser },
  }),
}));

vi.mock("@/utils/role", () => ({
  canManageAssets: mockCanManageAssets,
}));

// Import AFTER mocks
const { createHardware, getHardwareList, getHardwareByDepartment, deleteHardware } =
  await import("@/services/hardware");

/**
 * Chainable mock for Supabase query builder.
 * - chain methods return `this`
 * - `.then()` makes `await` work with the stored resolve value
 */
function stubQuery(data: unknown, error: unknown = null) {
  const resolve = vi.fn().mockResolvedValue({ data, error });
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => ({ data, error })),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    then: (onfulfilled: (v: unknown) => void) => resolve().then(onfulfilled),
    catch: (fn: (e: unknown) => void) => resolve().catch(fn),
  };
}

/** Stub auth + profile query so assertCanManageHardware passes. */
function stubAuth(role = "super_admin") {
  mockAuthGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
  const q = stubQuery({ role });
  mockFrom.mockReturnValueOnce(q);
}

describe("hardware service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getHardwareList ───────────────────────────────────────────────────
  describe("getHardwareList", () => {
    it("returns mapped hardware with nested state/department", async () => {
      const fakeData = [
        {
          id: "h1",
          asset_tag: "AST-001",
          type_hardware: "laptop",
          department: {
            name: "Dept A",
            facility: { name: "Fac 1", state: { name: "State 1" } },
          },
        },
      ];
      const q = stubQuery(fakeData);
      mockFrom.mockReturnValue(q);

      const result = await getHardwareList();

      expect(mockFrom).toHaveBeenCalledWith("hardware");
      expect(result).toHaveLength(1);
      expect(result[0].state).toBe("State 1");
      expect(result[0].department.name).toBe("Dept A");
    });

    it("returns empty array on error", async () => {
      mockFrom.mockReturnValue(stubQuery(null, new Error("fail")));
      expect(await getHardwareList()).toEqual([]);
    });
  });

  // ── getHardwareByDepartment ───────────────────────────────────────────
  describe("getHardwareByDepartment", () => {
    it("queries hardware filtered by department_id", async () => {
      const fakeData = [{ id: "h1", asset_tag: "AST-001" }];
      const q = stubQuery(fakeData);
      mockFrom.mockReturnValue(q);

      const result = await getHardwareByDepartment("dept-1");

      expect(mockFrom).toHaveBeenCalledWith("hardware");
      expect(q.eq).toHaveBeenCalledWith("department_id", "dept-1");
      expect(result).toEqual(fakeData);
    });

    it("returns empty array on error", async () => {
      mockFrom.mockReturnValue(stubQuery(null, new Error("fail")));
      expect(await getHardwareByDepartment("dept-1")).toEqual([]);
    });
  });

  // ── deleteHardware ────────────────────────────────────────────────────
  describe("deleteHardware", () => {
    it("deletes hardware by id after auth check", async () => {
      stubAuth("super_admin");

      const delQ = stubQuery(null);
      mockFrom.mockReturnValueOnce(delQ);

      await expect(deleteHardware("h-1")).resolves.toBeUndefined();
      expect(delQ.eq).toHaveBeenCalledWith("id", "h-1");
    });

    it("throws when not authenticated", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } });
      await expect(deleteHardware("h-1")).rejects.toThrow("logged in");
    });

    it("throws when user lacks permission", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "u-1" } } });
      mockFrom.mockReturnValueOnce(stubQuery({ role: "viewer" }));
      mockCanManageAssets.mockReturnValueOnce(false);

      await expect(deleteHardware("h-1")).rejects.toThrow("admin-level");
    });

    it("rethrows database error", async () => {
      stubAuth("super_admin");
      const delQ = stubQuery(null, new Error("DB fail"));
      mockFrom.mockReturnValueOnce(delQ);
      await expect(deleteHardware("h-1")).rejects.toThrow("DB fail");
    });
  });

  // ── createHardware ────────────────────────────────────────────────────
  describe("createHardware", () => {
    it("creates hardware with generated asset tag", async () => {
      stubAuth("super_admin");

      // Region → State → Facility → Department → Project → Insert
      mockFrom.mockReturnValueOnce(stubQuery([{ id: "r-1" }]));
      mockFrom.mockReturnValueOnce(stubQuery([{ id: "s-1" }]));
      mockFrom.mockReturnValueOnce(stubQuery([{ id: "f-1" }]));
      mockFrom.mockReturnValueOnce(stubQuery([{ id: "dept-1" }]));
      mockFrom.mockReturnValueOnce(stubQuery(null, new Error("no project")));
      // Contract lookup for asset tag generation
      mockFrom.mockReturnValueOnce(stubQuery([{ contract_number: "CN-001" }]));
      const insQ = stubQuery({ id: "new-hw" });
      mockFrom.mockReturnValueOnce(insQ);

      const result = await createHardware({
        typeHardware: "laptop",
        contractId: "c-1",
        projectId: "p-1",
      } as any);

      expect(insQ.insert).toHaveBeenCalled();
      expect(result).toEqual({ id: "new-hw" });
    });
  });
});
