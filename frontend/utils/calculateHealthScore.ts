interface UserInvite {
  inviteSentAt: Date | null;
  inviteOpenedAt: Date | null;
  inviteRedeemedAt: Date | null;
  registrationStartedAt: Date | null;
  registrationCompletedAt: Date | null;
}

const calculateHealthScore = (invite: UserInvite) => {
  let score = 0;
  const now = new Date();

  if (invite.inviteSentAt) {
    const inviteSentAt = new Date(invite.inviteSentAt);

    if (invite.inviteOpenedAt) {
      const inviteOpenedAt = new Date(invite.inviteOpenedAt);
      const diffInDays = (inviteOpenedAt.getTime() - inviteSentAt.getTime()) / (1000 * 3600 * 24);
      if (diffInDays <= 1) {
        score += 2;
      }
    } else {
      const diffInDays = (now.getTime() - inviteSentAt.getTime()) / (1000 * 3600 * 24);
      if (diffInDays > 7) {
        score -= 3;
      }
    }

    if (invite.inviteRedeemedAt) {
      const inviteRedeemedAt = new Date(invite.inviteRedeemedAt);
      const diffInDays = (inviteRedeemedAt.getTime() - inviteSentAt.getTime()) / (1000 * 3600 * 24);
      if (diffInDays <= 3) {
        score += 3;
      }
    }

    if (invite.registrationStartedAt) {
      score += 2;
    }

    if (invite.registrationCompletedAt) {
      score += 3;
    }

    if (
      !invite.inviteOpenedAt &&
      !invite.inviteRedeemedAt &&
      !invite.registrationStartedAt &&
      !invite.registrationCompletedAt
    ) {
      const diffInDays = (now.getTime() - inviteSentAt.getTime()) / (1000 * 3600 * 24);
      if (diffInDays > 5) {
        score -= 2;
      }
    }
  }

  let category = 'Low';
  if (score >= 6) {
    category = 'High';
  } else if (score >= 3 && score <= 5) {
    category = 'Medium';
  }

  return { healthScore: score, healthCategory: category };
};

export default calculateHealthScore;
