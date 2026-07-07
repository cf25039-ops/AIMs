import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock supabase client ────────────────────────────────────────────────────
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom }),
}));

// Import AFTER mock
const {
  getProjects,
  getAccessibleContracts,
  getContracts,
  getRegions,
  getStates,
  getFacilitiesForRegion,
  getDepartments,
} = await import("@/services/hierarchy");

/**
 * A chainable mock that mimics the Supabase query builder.
 * - chain methods (.select, .eq, .order, .limit) return `this`
 * - the builder exposes `.then()` so `await` triggers the resolve value
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
    then: (onfulfilled: (v: unknown) => void) => resolve().then(onfulfilled),
    catch: (fn: (e: unknown) => void) => resolve().catch(fn),
  };
}

describe("hierarchy service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProjects", () => {
    it("returns mapped projects on success", async () => {
      const q = stubQuery([
        { id: "1", name: "Project Alpha" },
        { id: "2", name: "Project Beta" },
      ]);
      mockFrom.mockReturnValue(q);

      const result = await getProjects();

      expect(mockFrom).toHaveBeenCalledWith("projects");
      expect(q.select).toHaveBeenCalledWith("id, name");
      expect(q.order).toHaveBeenCalledWith("name", { ascending: true });
      expect(result).toEqual([
        { id: "1", label: "Project Alpha" },
        { id: "2", label: "Project Beta" },
      ]);
    });

    it("returns empty array on error", async () => {
      const q = stubQuery(null, new Error("fail"));
      mockFrom.mockReturnValue(q);
      expect(await getProjects()).toEqual([]);
    });
  });

  describe("getAccessibleContracts", () => {
    it("returns mapped contracts on success", async () => {
      const q = stubQuery([
        { id: "c1", contract_number: "CN-001" },
        { id: "c2", contract_number: "CN-002" },
      ]);
      mockFrom.mockReturnValue(q);

      const result = await getAccessibleContracts();

      expect(mockFrom).toHaveBeenCalledWith("contracts");
      expect(result).toEqual([
        { id: "c1", label: "CN-001" },
        { id: "c2", label: "CN-002" },
      ]);
    });

    it("returns empty array on error", async () => {
      const q = stubQuery(null, new Error("fail"));
      mockFrom.mockReturnValue(q);
      expect(await getAccessibleContracts()).toEqual([]);
    });
  });

  describe("getContracts(projectId)", () => {
    it("returns empty array when projectId is empty", async () => {
      const result = await getContracts("");
      expect(result).toEqual([]);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("filters by project_id", async () => {
      const q = stubQuery([{ id: "c1", contract_number: "CN-001" }]);
      mockFrom.mockReturnValue(q);

      const result = await getContracts("proj-1");

      expect(q.eq).toHaveBeenCalledWith("project_id", "proj-1");
      expect(result).toEqual([{ id: "c1", label: "CN-001" }]);
    });
  });

  describe("getRegions(contractId)", () => {
    it("returns empty when contractId is empty", async () => {
      expect(await getRegions("")).toEqual([]);
    });

    it("filters by contract_id", async () => {
      const q = stubQuery([{ id: "r1", name: "Region 1" }]);
      mockFrom.mockReturnValue(q);

      const result = await getRegions("c-1");

      expect(q.eq).toHaveBeenCalledWith("contract_id", "c-1");
      expect(result).toEqual([{ id: "r1", label: "Region 1" }]);
    });

    it("returns empty on error", async () => {
      const q = stubQuery(null, new Error("fail"));
      mockFrom.mockReturnValue(q);
      expect(await getRegions("c-1")).toEqual([]);
    });
  });

  describe("getStates(regionId)", () => {
    it("returns empty when regionId is empty", async () => {
      expect(await getStates("")).toEqual([]);
    });

    it("filters by region_id", async () => {
      const q = stubQuery([{ id: "s1", name: "State 1" }]);
      mockFrom.mockReturnValue(q);
      expect(await getStates("r-1")).toEqual([{ id: "s1", label: "State 1" }]);
      expect(q.eq).toHaveBeenCalledWith("region_id", "r-1");
    });
  });

  describe("getFacilitiesForRegion(regionId)", () => {
    it("returns empty when regionId is empty", async () => {
      expect(await getFacilitiesForRegion("")).toEqual([]);
    });

    it("queries states → facilities → departments → hardware", async () => {
      const statesQ = stubQuery([{ id: "s1" }]);
      const facsQ = stubQuery([{ id: "f1", name: "Facility 1" }]);
      const deptsQ = stubQuery([{ id: "d1", facility_id: "f1" }]);
      const hwQ = stubQuery([{ id: "hw1", department_id: "d1" }]);
      mockFrom
        .mockReturnValueOnce(statesQ)
        .mockReturnValueOnce(facsQ)
        .mockReturnValueOnce(deptsQ)
        .mockReturnValueOnce(hwQ);

      const result = await getFacilitiesForRegion("r-1");

      expect(mockFrom).toHaveBeenCalledTimes(4);
      expect(result).toEqual([{ id: "f1", label: "Facility 1", count: 1 }]);
    });
  });

  describe("getDepartments(facilityId)", () => {
    it("returns empty when facilityId is empty", async () => {
      expect(await getDepartments("")).toEqual([]);
    });

    it("returns departments for a facility", async () => {
      const q = stubQuery([{ id: "d1", name: "Dept 1" }]);
      mockFrom.mockReturnValue(q);
      expect(await getDepartments("f-1")).toEqual([{ id: "d1", label: "Dept 1" }]);
      expect(q.eq).toHaveBeenCalledWith("facility_id", "f-1");
    });
  });

  // Close outer hub describe
});
