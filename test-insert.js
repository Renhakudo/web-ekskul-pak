require('dotenv').config({ path: '.env.local' });

async function test() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const swagger = await fetch(url).then(r => r.json());
    console.log("SCHEMA:", JSON.stringify(swagger.definitions.quiz_questions, null, 2));

    let u = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/quiz_questions?limit=1';
    let res = await fetch(u, { headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }});
    console.log("FIRST ROW:", await res.json());
}
test().catch(console.error);
