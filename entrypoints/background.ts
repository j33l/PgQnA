import { restrictSetupStorageAccess } from "./setup/storage";

export default defineBackground(() => {
  void restrictSetupStorageAccess().catch((error: unknown) => {
    console.error("Unable to restrict PgQnA storage access.", error);
  });
});
