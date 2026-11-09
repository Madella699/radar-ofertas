export type Offer = {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
  store: string;
  seller: string;
  price_cash: number | null;
  price_card: number;
  installments: number | null;
  installment_value: number | null;
  shipping: number | null;
  condition: "new" | "used" | "refurbished";
  product_url: string;
  verified_at: string;
  is_demo?: boolean;
};
