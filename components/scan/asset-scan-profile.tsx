import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AssetScanProfile } from "@/lib/qr/asset-scan-profile";

export function AssetScanProfileCard({
  profile,
  variant,
}: {
  profile: AssetScanProfile;
  variant: "full" | "compact";
}) {
  if (variant === "compact") {
    return (
      <Card className="border-purple-200 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-3 pt-6 text-sm">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-purple-950">{profile.name}</p>
            <p className="text-purple-900/70">
              {profile.ain} · {profile.branch}
              {profile.room !== "N/A" ? ` · ${profile.room}` : ""}
            </p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{profile.status}</Badge>
          <span className="text-purple-900/65">Custodian: {profile.custodian}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 shadow-sm">
      <CardContent className="grid gap-5 pt-6 md:grid-cols-[220px_1fr]">
        <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-3">
          {profile.photoUrl ? (
            <Image
              src={profile.photoUrl}
              alt={`${profile.name} photo`}
              width={400}
              height={170}
              className="h-[160px] w-full rounded-lg border border-purple-100 object-cover"
            />
          ) : (
            <div className="flex h-[160px] items-center justify-center rounded-lg border border-purple-100 bg-white text-sm text-purple-900/55">
              No photo uploaded
            </div>
          )}
          <div className="mt-3">
            <p className="font-semibold text-purple-950">{profile.name}</p>
            <p className="text-sm text-purple-900/65">{profile.serialNumber}</p>
          </div>
        </div>
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{profile.status}</Badge>
            <Badge variant="secondary">{profile.condition}</Badge>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <ProfileField label="AIN" value={profile.ain} />
            <ProfileField label="Category" value={profile.category} />
            <ProfileField label="Branch" value={profile.branch} />
            <ProfileField label="Department" value={profile.department} />
            <ProfileField label="Room" value={profile.room} />
            <ProfileField label="Shelf" value={profile.shelf} />
            <ProfileField label="Custodian" value={profile.custodian} />
            <ProfileField label="Warranty expiry" value={profile.warrantyExpiry} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-purple-100 bg-white p-3">
      <p className="text-xs text-purple-900/60">{label}</p>
      <p className="font-medium text-purple-950">{value}</p>
    </div>
  );
}
