export type UserRole = 'admin' | 'guru' | 'siswa';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  points: number;
  streak: number;
  created_at: string;
}

export interface Class {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  image_url: string | null;
  is_published: boolean;
  author_id: string;
  created_at: string;
}

// Nanti kita tambah interface lain (Material, Quiz) saat mengerjakan fitur itu.