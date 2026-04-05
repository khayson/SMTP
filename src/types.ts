export interface Email {
  id: number;
  message_id: string | null;
  subject: string;
  sender: string;
  recipients: string;
  html_body: string | null;
  text_body: string | null;
  created_at: string;
  raw_source: string;
  project_id: string;
  is_read: boolean;
  is_starred: boolean;
  folder: string;
}
