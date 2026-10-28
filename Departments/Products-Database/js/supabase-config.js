const SB_URL='https://nqihozwbdrvpyalctwbc.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWhvendiZHJ2cHlhbGN0d2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNjc1NTIsImV4cCI6MjEwNjk0MzU1Mn0.2PQ_F3jjjHo0iylNpvOb7RnDQNwNl-gT7IvIJDsTUwQ';
const BUCKET='phone-images',EMAIL_DOMAIN='@adeelmobile.com',IMG_SIZE=500;
const sb=supabase.createClient(SB_URL,SB_KEY);
const $=id=>document.getElementById(id);
// Website ka asli link yahan likho jab website internet par host ho jaye, jaise 'https://adeelmobile.com/'
const SITE_URL='';
