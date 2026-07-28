import { createClient } from "@/lib/supabase/server";
// It runs on the server, fetches data, then sends the final HTML to the browser.
// The user never sees the Supabase query — it happens before the page loads.

export default async function TestPage() {
  const supabase = await createClient();

  // Try to fetch all products — should return an empty array since we
  // haven't added any products yet. The important thing is: no error = connected!
  const { data: products, error } = await supabase
    .from("products")
    .select("*");

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        🔌 Supabase Connection Test
      </h1>

      {error ? (
        <div style={{ color: "red" }}>
          <p>❌ Connection FAILED</p>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      ) : (
        <div style={{ color: "green" }}>
          <p>✅ Connection SUCCESSFUL!</p>
          <p>Products found: {products?.length ?? 0}</p>
          <pre>{JSON.stringify(products, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
