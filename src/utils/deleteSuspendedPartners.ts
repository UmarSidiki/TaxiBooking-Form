import { connectDB } from "@/lib/database";
import { Partner } from "@/models/partner";

export async function deleteSuspendedPartners() {
  try {
    await connectDB();

    const now = new Date();

    // Find all suspended partners whose deletion date has passed
    const partnersToDelete = await Partner.find({
      status: "suspended",
      scheduledDeletionAt: { $lte: now },
    });

    if (partnersToDelete.length === 0) {
      console.log("✅ No suspended partners to delete");
      return {
        success: true,
        message: "No partners to delete",
        deleted: 0,
      };
    }

    // Delete the partners
    const deletedIds = partnersToDelete.map((p) => p._id);
    const deletedNames = partnersToDelete.map((p) => p.name);
    
    await Partner.deleteMany({
      _id: { $in: deletedIds },
    });

    console.log(
      `✅ Deleted ${partnersToDelete.length} suspended partners:`,
      deletedNames
    );

    return {
      success: true,
      message: `Successfully deleted ${partnersToDelete.length} suspended partners`,
      deleted: partnersToDelete.length,
      deletedIds: deletedIds.map(id => id.toString()),
      deletedNames,
    };
  } catch (error) {
    console.error("❌ Error deleting suspended partners:", error);
    return {
      success: false,
      error: "An error occurred while deleting suspended partners",
      deleted: 0,
    };
  }
}
