import { MOVEMENT_TYPE } from "@/constants";
import { QR_LOCATION_TYPES, type QrLocationType } from "@/lib/qr/payload";

export { QR_LOCATION_TYPES, type QrLocationType };

export function movementFromLocationType(locationType: QrLocationType): string {
  if (locationType === QR_LOCATION_TYPES.SHELF) return MOVEMENT_TYPE.SHELF_TRANSFER;
  if (locationType === QR_LOCATION_TYPES.ROOM) return MOVEMENT_TYPE.ROOM_TRANSFER;
  return MOVEMENT_TYPE.BRANCH_TRANSFER;
}
