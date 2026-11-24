import { permanentRedirect } from "next/navigation";

// Loan assistance was removed from the website; old links land on the contact page.
export default function LoanPage(): never {
  permanentRedirect("/contact");
}
