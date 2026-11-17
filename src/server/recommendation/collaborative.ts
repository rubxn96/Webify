import prisma from '@/lib/db/prisma';

export class CollaborativeRecommender {
  /**
   * Generates item-item collaborative recommendations for a user based on co-occurrence in listening events
   * Returns a map of candidate trackId -> collaborative score [0.0, 1.0]
   */
  public async getCollaborativeScores(
    userId?: string,
    sessionId?: string,
    userHistoryTrackIds: string[] = []
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>();

    // 1. If cold start with no history, collaborative scores are neutral
    if ((!userId && !sessionId) || userHistoryTrackIds.length === 0) {
      return scores;
    }

    try {
      // Find other users/sessions that also listened to the same tracks with positive weight
      const seedIds = userHistoryTrackIds.slice(0, 15);

      const peerEvents = await prisma.listeningEvent.findMany({
        where: {
          trackId: { in: seedIds },
          weight: { gt: 1.0 }, // completed, liked, or 80%
          OR: [
            userId ? { userId: { not: userId } } : undefined,
            sessionId ? { sessionId: { not: sessionId } } : undefined,
          ].filter(Boolean) as any,
        },
        select: { userId: true, sessionId: true },
        take: 100,
      });

      const peerUserIds = Array.from(new Set(peerEvents.map((p) => p.userId).filter(Boolean))) as string[];
      const peerSessionIds = Array.from(new Set(peerEvents.map((p) => p.sessionId).filter(Boolean))) as string[];

      if (peerUserIds.length === 0 && peerSessionIds.length === 0) {
        return scores;
      }

      // Find tracks positively interacted with by these peers that target user hasn't heard yet
      const candidateEvents = await prisma.listeningEvent.findMany({
        where: {
          OR: [
            peerUserIds.length > 0 ? { userId: { in: peerUserIds } } : undefined,
            peerSessionIds.length > 0 ? { sessionId: { in: peerSessionIds } } : undefined,
          ].filter(Boolean) as any,
          trackId: { notIn: userHistoryTrackIds },
          weight: { gt: 0 },
        },
        select: {
          trackId: true,
          weight: true,
        },
        take: 300,
      });

      // Accumulate collaborative weights
      const rawMap = new Map<string, number>();
      let maxScore = 0.1;

      for (const ev of candidateEvents) {
        const cur = rawMap.get(ev.trackId) || 0;
        const next = cur + ev.weight;
        rawMap.set(ev.trackId, next);
        if (next > maxScore) maxScore = next;
      }

      // Normalize to [0.0, 1.0]
      for (const [tId, val] of rawMap.entries()) {
        scores.set(tId, Math.min(1.0, parseFloat((val / maxScore).toFixed(4))));
      }
    } catch (err) {
      console.warn('[CollaborativeRecommender] Collaborative scoring notice:', err);
    }

    return scores;
  }
}

export const collaborativeRecommender = new CollaborativeRecommender();

