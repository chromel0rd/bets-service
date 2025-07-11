export interface CreateBetRequest {
  amount: number;
}

export interface CreateBetResponse {
  id: number;
  amount: number;
  status: "pending" | "completed";
  created_at: string;
}
