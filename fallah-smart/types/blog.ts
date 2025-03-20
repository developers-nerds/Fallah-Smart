import { GestureResponderEvent } from 'react-native';
import React from 'react';

// Route parameters for blog navigation
export interface RouteParams {
  searchTerm?: string;
  searchByHashtag?: boolean;
}

// User/author information
export interface Author {
  id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profilePicture?: string;
  role?: string;
}

// Media item in posts
export interface PostMedia {
  url: string;
  type?: string;
}

// Blog post structure
export interface Post {
  id: string;
  title: string;
  description?: string;
  category: string;
  author?: Author;
  user?: Author & { role?: string };
  media?: PostMedia[];
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  userLiked: boolean;
  userId?: string;
  _isEnhancedDuplicate?: boolean; // Flag for duplicated posts
  comments?: Comment[];
  likes?: { userId: string }[];
}

// Structure for image assets when uploading
export interface ImageAsset {
  uri: string;
  type: string;
  name: string;
  width: number;
  height: number;
}

// Props for the PostItem component
export interface PostItemProps {
  item: Post;
  navigation: any;
  handlePostLike: (postId: string) => void;
  handleCommentAdded: (postId: string) => void;
  timeAgo: (date: string) => string;
  renderCategoryIcon: (category: string) => React.ReactNode;
  BASE_URL: string;
  openReportModal: (post: Post) => void;
  handleSharePost: (post: Post) => void;
  isCurrentUserPost: boolean;
  currentUserRole: string | null;
  currentUser: any;
  handleHashtagPress: (tag: string) => void;
}

// Props for the SearchBar component
export interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

// Category type definition
export interface CategoryType {
  value: string;
  label: string;
  icon: string;
  iconType: 'material' | 'fontawesome' | 'feather';
}

// Helper type for parsed text with hashtags
export interface ParsedTextPart {
  type: 'text' | 'hashtag';
  content: string;
  tag?: string;
}
