const test = async () => {
    try {
        const res = await fetch('http://localhost:5000/api/announcements?userId=8');
        console.log('Announcements with userId:', res.status);
        const data = await res.json();
        console.log('Count:', data.length);
    } catch (e) {
        console.log('Error:', e.message);
    }
}
test();
