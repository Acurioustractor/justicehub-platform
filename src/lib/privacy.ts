export const getPrivacyLabel = (level: string) => {
  switch (level) {
    case 'public': return 'Public';
    case 'community': return 'Community';
    case 'private': return 'Private';
    default: return 'Unknown';
  }
};

export const isStoryVisible = (story: any, userRole?: string) => {
  if (!story.visibility) return true;
  
  switch (story.visibility) {
    case 'public':
      return true;
    case 'community':
      return !!userRole;
    case 'private':
      return false;
    default:
      return true;
  }
};