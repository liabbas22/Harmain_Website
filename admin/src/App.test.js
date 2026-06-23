import { render, screen } from "@testing-library/react";
import App from "./App";

test("shows the admin sign in screen", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /restaurant control room/i })).toBeInTheDocument();
});
