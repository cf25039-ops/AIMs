"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AccessDenied } from "@/components/auth/access-denied";
import { ticketFormSchema, type TicketFormValues } from "@/schemas/maintenance";
import { createTicket, uploadTicketImage } from "@/services/maintenance";
import toast from "react-hot-toast";
import { getHardwareList } from "@/services/hardware";
import { useRole } from "@/contexts/role-context";
import { canCreateTickets } from "@/utils/role";
import { ArrowLeft, Check, Loader2, Search, UploadCloud } from "lucide-react";
import Link from "next/link";

export default function CreateTicketPage() {
  const router = useRouter();
  const { role, isLoading: roleLoading } = useRole();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [assetSearch, setAssetSearch] = useState("");

  const { data: hardwareList = [] } = useQuery({
    queryKey: ["hardware"],
    queryFn: getHardwareList,
  });

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      severity: "low",
    },
  });

  const selectedAssetId = form.watch("assetId");

  const filteredHardwareList = useMemo(() => {
    const query = assetSearch.trim().toLowerCase();
    if (!query) return hardwareList;

    return hardwareList.filter((asset: any) => {
      const haystack = [
        asset.asset_tag,
        asset.serial_number,
        asset.type_hardware,
        asset.brand,
        asset.model,
        asset.pic_name,
        asset.department?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [assetSearch, hardwareList]);

  const selectedAsset = useMemo(
    () => hardwareList.find((asset: any) => asset.id === selectedAssetId),
    [hardwareList, selectedAssetId]
  );

  const formatAssetLabel = (asset: any) =>
    `${asset.asset_tag} - ${asset.type_hardware} (${asset.department?.name || "Unknown Location"})`;

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canCreateTickets(role)) {
    return (
      <AccessDenied
        title="Ticket Creation Restricted"
        description="Technicians can work on assigned repair tickets, but new issue reports must be opened by admins or end users."
        href="/maintenance"
        actionLabel="Back to Maintenance"
      />
    );
  }

  const onSubmit = async (values: TicketFormValues) => {
    setIsSubmitting(true);
    try {
      let attachmentUrl = "";
      if (file) {
        setUploading(true);
        attachmentUrl = await uploadTicketImage(file);
        setUploading(false);
      }

      await createTicket({ ...values, attachmentUrl });
      router.push("/maintenance");
      toast.success("Ticket created successfully!");
    } catch (error) {
      console.error("Failed to create ticket:", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to submit ticket: ${msg}`);
    } finally {
      setIsSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <FadeIn>
        <div className="flex items-center gap-4">
          <Link href="/maintenance">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold">Report New Issue</h2>
            <p className="text-sm text-muted-foreground">Create a repair ticket for faulty hardware</p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Ticket Details</CardTitle>
            <CardDescription>
              Please provide clear and accurate information to help technicians resolve the issue faster.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Hardware Asset</label>
                  <input type="hidden" {...form.register("assetId")} />
                  <div className="mt-1 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={assetSearch}
                        onChange={(event) => setAssetSearch(event.target.value)}
                        placeholder={selectedAsset ? formatAssetLabel(selectedAsset) : "Search or select an asset..."}
                        className="pl-9"
                      />
                    </div>

                    {selectedAsset ? (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate font-medium text-primary">
                            {formatAssetLabel(selectedAsset)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              form.setValue("assetId", "", { shouldDirty: true, shouldValidate: true });
                              setAssetSearch("");
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-card/80 shadow-sm">
                      {filteredHardwareList.length === 0 ? (
                        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                          No matching asset found.
                        </div>
                      ) : (
                        filteredHardwareList.map((asset: any) => {
                          const isSelected = asset.id === selectedAssetId;
                          return (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => {
                                form.setValue("assetId", asset.id, { shouldDirty: true, shouldValidate: true });
                                setAssetSearch("");
                              }}
                              className="flex w-full items-start justify-between gap-3 border-b border-border/60 px-3 py-2.5 text-left text-sm transition hover:bg-muted/60 last:border-b-0"
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-medium">
                                  {asset.asset_tag} - {asset.type_hardware}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                  {[asset.brand, asset.model, asset.department?.name, asset.pic_name]
                                    .filter(Boolean)
                                    .join(" | ") || "No extra details"}
                                </span>
                              </span>
                              {isSelected ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : null}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                  {form.formState.errors.assetId && (
                    <p className="text-xs text-rose-500 mt-1">{form.formState.errors.assetId.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Issue Title</label>
                  <Input {...form.register("issueTitle")} placeholder="e.g. Screen flickering occasionally" />
                  {form.formState.errors.issueTitle && (
                    <p className="text-xs text-rose-500 mt-1">{form.formState.errors.issueTitle.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Severity Level</label>
                  <Select {...form.register("severity")}>
                    <option value="critical">Critical (System down, impacting patient care)</option>
                    <option value="high">High (Major functionality broken)</option>
                    <option value="medium">Medium (Partial functionality broken)</option>
                    <option value="low">Low (Minor issue, bypass available)</option>
                  </Select>
                  {form.formState.errors.severity && (
                    <p className="text-xs text-rose-500 mt-1">{form.formState.errors.severity.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Detailed Description</label>
                  <textarea
                    {...form.register("issueDescription")}
                    className="flex min-h-[100px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describe what happened, error codes (if any), and steps to reproduce..."
                  />
                  {form.formState.errors.issueDescription && (
                    <p className="text-xs text-rose-500 mt-1">{form.formState.errors.issueDescription.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Upload Evidence (Optional)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                      <UploadCloud className="h-8 w-8 mb-2" />
                      <p className="text-sm">
                        {file ? <span className="font-semibold text-primary">{file.name}</span> : <span>Click to upload image or drag and drop</span>}
                      </p>
                      <p className="text-xs mt-1">PNG, JPG or WEBP (Max 5MB)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting || uploading}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploading ? "Uploading Evidence..." : "Submitting Ticket..."}
                    </>
                  ) : (
                    "Submit Repair Ticket"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
