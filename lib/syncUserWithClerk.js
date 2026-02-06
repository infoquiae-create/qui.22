import prisma from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Syncs a Clerk user's data with the Prisma database
 * @param {string} userId - The Clerk user ID
 * @returns {Promise<Object>} The synced user data
 */
export async function syncClerkUserWithPrisma(userId) {
    try {
        const clerkUser = await clerkClient.users.getUser(userId);
        const userData = {
            name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            image: clerkUser.imageUrl || '',
        };

        const dbUser = await prisma.user.upsert({
            where: { id: userId },
            update: userData,
            create: {
                id: userId,
                ...userData,
                cart: {},
            }
        });

        return dbUser;
    } catch (error) {
        console.error('Error syncing user with Clerk:', error);
        // Return a minimal user object if sync fails
        return {
            id: userId,
            name: 'User',
            email: '',
            image: '',
        };
    }
}
