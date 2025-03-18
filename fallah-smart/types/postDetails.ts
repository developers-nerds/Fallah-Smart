import { GestureResponderEvent } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Post, Author, ParsedTextPart } from './blog';

// Define route params
export interface PostDetailParams {
  postId: string;
}

// Navigation props
export interface PostDetailNavigationProps {
  route: RouteProp<{ PostDetail: PostDetailParams }, 'PostDetail'>;
  navigation: StackNavigationProp<any, 'PostDetail'>;
}

// Media types for comments
export interface MediaItem {
  url?: string;
  uri?: string;
  type?: string;
}

// Comment type
export interface Comment {
  id: string;
  text: string;
  user?: Author;
  author?: Author;
  createdAt: string;
  image?: string;
  media?: MediaItem[];
}

// Props for the comment image gallery component
export interface CommentImageGalleryProps {
  media: MediaItem[];
}

// Props for the post image gallery component
export interface PostImageGalleryProps {
  media: MediaItem[];
}

// State for the component
export interface PostDetailState {
  post: Post | null;
  loading: boolean;
  error: string | null;
  comments: Comment[];
  liked: boolean;
  newComment: string;
  commentImage: MediaItem | null;
  submitting: boolean;
  reportModalVisible: boolean;
  reportReason: string;
  customReason: string;
  isSubmittingReport: boolean;
}
