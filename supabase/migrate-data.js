/* =========================================================
   MIGRASI DATA — Jalankan SEKALI di browser console
   Buka admin.html (atau index.html), lalu paste ke DevTools Console.
   Pastikan supabase-config.js sudah diisi dengan URL & key yang benar.
========================================================= */

async function migrateData() {
  console.log('🚀 Memulai migrasi data...');

  // ---- DATA PORTFOLIO (sama persis dari script.js asli) ----
  const portfolioData = [
    {
      id: "yt-4", title: "MAUJUD BUDAYA - REFLEKSI ETIKA DALAM SIRI' NA PACCE",
      category: "Long Video (YouTube)", type: "youtube",
      sourceUrl: "https://www.youtube.com/watch?si=XZhp7bGvLgz_drdL&v=Kr2JB3yikpQ&feature=youtu.be",
      embedUrl: "https://www.youtube.com/embed/Kr2JB3yikpQ",
      thumbnailUrl: "https://img.youtube.com/vi/Kr2JB3yikpQ/hqdefault.jpg",
      description: "Membahas tentang nilai budaya dan etika yang terkandung dalam konsep Siri' na Pacce — prinsip moral penting dalam budaya Bugis-Makassar. Menampilkan penjelasan nilai-nilai etika dalam konteks kehidupan sehari-hari, contoh praktik dalam masyarakat, serta refleksi bagaimana Siri' na Pacce membentuk perilaku sosial dan hubungan antar manusia dan Tuhan.",
      tags: ["Dialog", "Budaya", "Etika"],
    },
    {
      id: "yt-1", title: "KENAPA KITA HARUS PEDULI DENGAN SUMATERA?",
      category: "Long Video (YouTube)", type: "youtube",
      sourceUrl: "https://youtu.be/4S5Z7V8j-EA",
      embedUrl: "https://www.youtube.com/embed/4S5Z7V8j-EA",
      thumbnailUrl: "https://img.youtube.com/vi/4S5Z7V8j-EA/hqdefault.jpg",
      description: "Dalam 15 menit, video ini mengajak kamu memahami apa yang sedang terjadi di Sumatera: bukan sekadar bencana, tapi hasil dari keputusan, sistem, dan cara kita memperlakukan alam selama bertahun-tahun",
      tags: ["Cinematic - Monolog Rian Fahardhi"],
    },
    {
      id: "yt-2", title: "Museum Balla Lompoa",
      category: "Long Video (YouTube)", type: "youtube",
      sourceUrl: "https://youtu.be/iDwKQiJnNgs?si=gPw2Jc9qNLiWak5n",
      embedUrl: "https://www.youtube.com/embed/iDwKQiJnNgs",
      thumbnailUrl: "https://img.youtube.com/vi/iDwKQiJnNgs/hqdefault.jpg",
      description: "Museum Balla Lompoa Gowa adalah sebuah museum sejarah yang berisi koleksi artefak dan warisan budaya, dari kerajaan Gowa. Konten ini berfokus pada penjelasan sejarah museum, koleksi benda-benda bersejarah, serta nilai budaya yang tersimpan di dalamnya, dengan melibatkan narasumber dibidang Akademik, Sejarawan, serta pemerhati Adat Budaya.",
      tags: ["Semi-dokumenter", "Historical Site", "Museum"],
    },
    {
      id: "yt-3", title: "ILMU TASAWUF DATO RI TIRO DI TANAH PANRITA LOPI BULUKUMBA",
      category: "Long Video (YouTube)", type: "youtube",
      sourceUrl: "https://youtu.be/GJR7u2azBGU?si=27ddixmt9_ldhsf_",
      embedUrl: "https://www.youtube.com/embed/GJR7u2azBGU",
      thumbnailUrl: "https://img.youtube.com/vi/GJR7u2azBGU/hqdefault.jpg",
      description: "Ilmu Tasawuf Dato ri Tiro di Tanah Panrita Lopi - Bulukumba merupakan video yang membahas tentang peran Dato Ri Tiro di tanah Bulukumba. Konten ini berfokus pada sejarah dan ajaran tasawuf yang dibawa oleh Dato Ri Tiro (tokoh penting dalam tradisi spiritual di tanah Panrita Lopi), serta bagaimana ajaran tersebut berkembang dan dipraktikkan khususnya di Bulukumba.",
      tags: ["Semi-dokumenter", "Spiritual", "History"],
    },
    {
      id: "yt-5", title: "MENGHALAU GEMPURAN BUDAYA ASING LEWAT FILM LOKAL - PASANG",
      category: "Long Video (YouTube)", type: "youtube",
      sourceUrl: "https://www.youtube.com/watch?v=t9ZkRZsAr8g&t=68s",
      embedUrl: "https://www.youtube.com/embed/t9ZkRZsAr8g",
      thumbnailUrl: "https://img.youtube.com/vi/t9ZkRZsAr8g/hqdefault.jpg",
      description: "PASANG Podcast, Adat, Sejarah & Pappasang yang diselenggarakan oleh Mitologi Bumi Sulawesi bekerja sama dengan Kementrian Pendidikan, Kebudayaan, Riset dan Teknologi, Dana Indonesiana dan Lembaga Pengelola Dana Pendidikan (LPDP)",
      tags: ["Podcast", "Adat", "Sejarah"],
    },
    {
      id: "yt-6", title: "Monolog Rian Fahardhi – Keunggulan yang Tidak Adil dari Seorang Introvert",
      category: "Long Video (YouTube)", type: "youtube",
      sourceUrl: "https://www.youtube.com/watch?v=iHMji8VraBo",
      embedUrl: "https://www.youtube.com/embed/iHMji8VraBo",
      thumbnailUrl: "https://img.youtube.com/vi/iHMji8VraBo/hqdefault.jpg",
      description: "Video ini membahas: • Kenapa sistem modern tidak ramah untuk introvert • Cara kerja otak introvert (Susan Cain & neurosains) • System 1 vs System 2 (Daniel Kahneman) • Kenapa dunia menghargai reaksi cepat, bukan refleksi • Dan bagaimana memilih arena yang tepat bisa mengubah segalanya.",
      tags: ["monolog", "Edukasi", "Psikologi"],
    },
    {
      id: "yt-7", title: "Monolog Rian Fahardhi – Kegagalan Resolusi 2026 (Part 2)",
      category: "Long Video (YouTube)", type: "youtube",
      sourceUrl: "https://www.youtube.com/watch?v=Yyfobk9wMAM",
      embedUrl: "https://www.youtube.com/embed/Yyfobk9wMAM",
      thumbnailUrl: "https://img.youtube.com/vi/Yyfobk9wMAM/hqdefault.jpg",
      description: "Di video ini, kita bahas kenapa hidup banyak orang tidak benar-benar bergerak dari tahun ke tahun, walaupun sibuk, capek, dan merasa \"sudah berusaha\". Masalahnya bukan di motivasi tapi di kedewasaan cara mengambil tanggung jawab dan membangun sistem hidup.",
      tags: ["monolog", "Edukasi", "Psikologi"],
    },
    {
      id: "yt-8", title: "Monolog Rian Fahardhi – Kegagalan Resolusi 2026 (Part 1)",
      category: "Long Video (YouTube)", type: "youtube",
      sourceUrl: "https://www.youtube.com/watch?v=G--tk4UpQGo",
      embedUrl: "https://www.youtube.com/embed/G--tk4UpQGo",
      thumbnailUrl: "https://img.youtube.com/vi/G--tk4UpQGo/hqdefault.jpg",
      description: "Video ini tentang mendesain tahun yang benar-benar bisa dijalani berdasarkan psikologi perilaku, riset ilmiah, dan praktik yang realistis.",
      tags: ["monolog", "Edukasi", "Psikologi"],
    },
    // PROJECT VIDEO (DRIVE FOLDER)
    {
      id: "drv-project-1", title: "Outbound Kementrian Sosial",
      category: "Project Video", type: "drive_folder",
      sourceUrl: "https://drive.google.com/drive/folders/1ImzKdaxz5l38ADzI9IKnGnfuZXEtAeu1?usp=sharing",
      thumbnailUrl: "", description: "Video Dokumentasi Outbound program Kementrian Sosial dengan melibatkan sekolah SRMA 26 MAKASSAAR yang berlangsung selama 3 hari di kabupaten Maros dengan tujuan pengembangan diri siswa yang dilakukan di luar sekolah.",
      tags: ["Video Dokumentasi", "Outbound", "Kemensos"],
      items: [
        { title: "Outbound Kementrian Sosial", sourceUrl: "https://drive.google.com/file/d/1kCmpmCoKG6pcMQtJcZGNPk5YiFl0fayN/view?usp=sharing", embedUrl: "https://drive.google.com/file/d/1kCmpmCoKG6pcMQtJcZGNPk5YiFl0fayN/preview" },
      ],
    },
    {
      id: "drv-project-2", title: "Universitas Negeri Makassar",
      category: "Project Video", type: "drive_folder",
      sourceUrl: "https://drive.google.com/drive/folders/1beuiu1rXhvBLPoXOzT4Xe31cChU82Vmy",
      thumbnailUrl: "", description: "Project Trailer dan dokumentasi Event Fakultas Teknik & Fakultas Seni dan Desain Universitas Negeri Makassar",
      tags: ["Video Dokumentasi", "UNM", "Event Kampus"],
      items: [
        { title: "Dokumentasi Fakultas Teknik UNM – Tata Rias", sourceUrl: "https://drive.google.com/file/d/1ppiC4l11EN63FmgPaUnFrDJ3LU5Z2K2i/view", embedUrl: "https://drive.google.com/file/d/1ppiC4l11EN63FmgPaUnFrDJ3LU5Z2K2i/preview" },
        { title: "Trailer UNM Fakultas Seni & Desain", sourceUrl: "https://drive.google.com/file/d/1LYFUUg12zt1voKvVrGd4ugg3b5dbwOjC/view", embedUrl: "https://drive.google.com/file/d/1LYFUUg12zt1voKvVrGd4ugg3b5dbwOjC/preview" },
        { title: "Trailer Fakultas Teknik – Tata Rias", sourceUrl: "https://drive.google.com/file/d/1H-fl5eU7bzZdOE0ZOEzcUN_nzexRyN6y/view", embedUrl: "https://drive.google.com/file/d/1H-fl5eU7bzZdOE0ZOEzcUN_nzexRyN6y/preview" },
      ],
    },
    {
      id: "drv-project-3", title: "Mawangi Digital Printing",
      category: "Project Video", type: "drive_folder",
      sourceUrl: "https://drive.google.com/drive/folders/1NotActDUIJVO04amTB6-HKGemhmryNZU",
      thumbnailUrl: "", description: "Company Profile & Videotron ads Mawangi Digital Printing",
      tags: ["Company Profile", "Videotron", "Mawangi"],
      items: [
        { title: "Mawangi Digital Printing", sourceUrl: "https://drive.google.com/file/d/1rG-XVURHS1Tt66PXR-dZ3Fs_tgppNcgn/view", embedUrl: "https://drive.google.com/file/d/1rG-XVURHS1Tt66PXR-dZ3Fs_tgppNcgn/preview" },
        { title: "Slide Produk", sourceUrl: "https://drive.google.com/file/d/1ELXs4trvhYk79V0m35ylUjRXZwRhZJVE/view", embedUrl: "https://drive.google.com/file/d/1ELXs4trvhYk79V0m35ylUjRXZwRhZJVE/preview" },
        { title: "Slide Produk 2", sourceUrl: "https://drive.google.com/file/d/1rqBJ3aZ6-qp2-HVkxrqvNInnPo5ToK9-/view", embedUrl: "https://drive.google.com/file/d/1rqBJ3aZ6-qp2-HVkxrqvNInnPo5ToK9-/preview" },
      ],
    },
    {
      id: "drv-project-4", title: "MaPaN Nusantara",
      category: "Project Video", type: "drive_folder",
      sourceUrl: "https://drive.google.com/drive/folders/1ipt87w22vkppmKrRzvIUeREwFfsa48yy",
      thumbnailUrl: "", description: "Video ads PT Mitra Pariwara Nusantara (MaPaN)",
      tags: ["Video Ads", "MaPaN", "Storyboard"],
      items: [
        { title: "MaPaN Storyboard 4 R", sourceUrl: "https://drive.google.com/file/d/1vUCc0iHNArlu4IWYmBLJk7H0eQIcccTF/view", embedUrl: "https://drive.google.com/file/d/1vUCc0iHNArlu4IWYmBLJk7H0eQIcccTF/preview" },
        { title: "Storyboard 1 HD", sourceUrl: "https://drive.google.com/file/d/1vUCc0iHNArlu4IWYmBLJk7H0eQIcccTF/view", embedUrl: "https://drive.google.com/file/d/1vUCc0iHNArlu4IWYmBLJk7H0eQIcccTF/preview" },
        { title: "Storyboard 1 MaPaN r2", sourceUrl: "https://drive.google.com/file/d/14-Cng3qz0rMSCMQ2o4I29mNWT81xYSCh/view", embedUrl: "https://drive.google.com/file/d/14-Cng3qz0rMSCMQ2o4I29mNWT81xYSCh/preview" },
        { title: "Storyboard 2 HD", sourceUrl: "https://drive.google.com/file/d/1ZQ8zFToDQ80ExA87ISEeYK0XuItwtvfH/view", embedUrl: "https://drive.google.com/file/d/1ZQ8zFToDQ80ExA87ISEeYK0XuItwtvfH/preview" },
        { title: "Storyboard 3 HD", sourceUrl: "https://drive.google.com/file/d/19o81SfvNVQk-14S4jokh820dnioLt3uc/view", embedUrl: "https://drive.google.com/file/d/19o81SfvNVQk-14S4jokh820dnioLt3uc/preview" },
        { title: "Storyboard 3 MaPaN R HD", sourceUrl: "https://drive.google.com/file/d/1Iqc-StweZHAR9GJ0gY8QUvnqVFeDr3Vj/view", embedUrl: "https://drive.google.com/file/d/1Iqc-StweZHAR9GJ0gY8QUvnqVFeDr3Vj/preview" },
        { title: "Storyboard 3 MaPaN", sourceUrl: "https://drive.google.com/file/d/15rW5kLJQNdD6YWniwG9ySMdeRX833xnY/view", embedUrl: "https://drive.google.com/file/d/15rW5kLJQNdD6YWniwG9ySMdeRX833xnY/preview" },
        { title: "Storyboard 4 CC HD", sourceUrl: "https://drive.google.com/file/d/1RwcaA9fgTLcw86v6oxPxjMHNJ1qA0dbT/view", embedUrl: "https://drive.google.com/file/d/1RwcaA9fgTLcw86v6oxPxjMHNJ1qA0dbT/preview" },
        { title: "Storyboard 5 HD", sourceUrl: "https://drive.google.com/file/d/19r411QQ9b1VOTFM7WJzQOV7vvyJowdWX/view", embedUrl: "https://drive.google.com/file/d/19r411QQ9b1VOTFM7WJzQOV7vvyJowdWX/preview" },
      ],
    },
    {
      id: "drv-project-5", title: "Wedding",
      category: "Project Video", type: "drive_folder",
      sourceUrl: "https://drive.google.com/drive/folders/1ImzKdaxz5l38ADzI9IKnGnfuZXEtAeu1",
      thumbnailUrl: "", description: "Cinematic Wedding Project",
      tags: ["Wedding", "Cinematic", "Video"],
      items: [
        { title: "Wedding Edwin & Nurul", sourceUrl: "https://drive.google.com/file/d/1qyHhRr-UDuqg5JzkFKFAFR1-3K8qxhCQ/view", embedUrl: "https://drive.google.com/file/d/1qyHhRr-UDuqg5JzkFKFAFR1-3K8qxhCQ/preview" },
        { title: "Trailer Putri & Randi 4K", sourceUrl: "https://drive.google.com/file/d/1kZ2NKzflGhh4LKliZlgm2pTtKcYRcIZL/view", embedUrl: "https://drive.google.com/file/d/1kZ2NKzflGhh4LKliZlgm2pTtKcYRcIZL/preview" },
        { title: "Trailer Nurisana", sourceUrl: "https://drive.google.com/file/d/1L16hMJWPnMm5G9Wb0eyfN9V5lcPXaRqg/view", embedUrl: "https://drive.google.com/file/d/1L16hMJWPnMm5G9Wb0eyfN9V5lcPXaRqg/preview" },
        { title: "Trailer Fadia & Angga", sourceUrl: "https://drive.google.com/file/d/1PYLxGA-SqF30fe7ZJy8QtGes_ccMGCGW/view", embedUrl: "https://drive.google.com/file/d/1PYLxGA-SqF30fe7ZJy8QtGes_ccMGCGW/preview" },
        { title: "Prewedding Outdoor Cinematic", sourceUrl: "https://drive.google.com/file/d/1Q7aFFyD15NB5h3kfynoYhghq1N4xzzEu/view", embedUrl: "https://drive.google.com/file/d/1Q7aFFyD15NB5h3kfynoYhghq1N4xzzEu/preview" },
        { title: "Mappetuada Putri & Usri HD", sourceUrl: "https://drive.google.com/file/d/1Hrpead5CODAMqdIv8xdKa7y6IGFIJmxy/view", embedUrl: "https://drive.google.com/file/d/1Hrpead5CODAMqdIv8xdKa7y6IGFIJmxy/preview" },
      ],
    },
    // SHORT VIDEO IG
    { id: "ig-short-1", title: "Rian Fahardhi - Surat untuk Elit", category: "Short Video (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/DRwPYeaE5vM/", embedUrl: "", thumbnailUrl: "https://via.placeholder.com/900x600.png?text=IG+Reels+1", description: "Short video Instagram oleh Rian Fahardhi.", tags: ["IG", "Reels", "Rian Fahardhi"] },
    { id: "ig-short-2", title: "Rian Fahardhi - Doomscrolling", category: "Short Video (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/DRBudYxk6B7/", embedUrl: "", thumbnailUrl: "https://via.placeholder.com/900x600.png?text=IG+Reels+2", description: "Short video Instagram oleh Rian Fahardhi.", tags: ["IG", "Reels", "Rian Fahardhi"] },
    { id: "ig-short-3", title: "Rian Fahardhi - Ketidakadilan Antar Generasi", category: "Short Video (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/DSRk1Byk5l4/", embedUrl: "", thumbnailUrl: "https://via.placeholder.com/900x600.png?text=IG+Reels+3", description: "Short video Instagram oleh Rian Fahardhi.", tags: ["IG", "Reels", "Rian Fahardhi"] },
    { id: "ig-short-4", title: "Rian Fahardhi - Short ad Launching Buku Filsafat Kecemasan", category: "Short Video (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/DVOSg4eE7FG/", embedUrl: "", thumbnailUrl: "https://via.placeholder.com/900x600.png?text=IG+Reels+4", description: "", tags: ["IG", "Reels", "Ads"] },
    { id: "ig-short-5", title: "Mitologi Bumi Sulawesi - Tradisi Sayyang Pattuqduq", category: "Short Video (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/DDyy_1tzCgX/", embedUrl: "", thumbnailUrl: "https://via.placeholder.com/900x600.png?text=IG+Reels+5", description: "Mitologi Bumi Sulawesi – Tradisi Sayyang Pattuqduq.", tags: ["IG", "Reels", "Budaya", "Sulawesi"] },
    { id: "ig-short-6", title: "Mitologi Bumi Sulawesi - Tindakan Amoral Terhadap Perempuan", category: "Short Video (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/DCvI-kKTvpj/", embedUrl: "", thumbnailUrl: "https://via.placeholder.com/900x600.png?text=IG+Reels+6", description: "Mitologi Bumi Sulawesi – isu sosial & perempuan.", tags: ["IG", "Reels", "Sosial"] },
    { id: "ig-short-7", title: "Mitologi Bumi Sulawesi - Tradisi Pakkio' Bunting", category: "Short Video (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/DAkjcBRRb3C/", embedUrl: "", thumbnailUrl: "https://via.placeholder.com/900x600.png?text=IG+Reels+7", description: "Mitologi Bumi Sulawesi – Tradisi Pakkio' Bunting.", tags: ["IG", "Reels", "Budaya"] },
    { id: "ig-short-8", title: "Muhammad Yusran - Pappasang Karaeng Pattingalloang", category: "Short Video (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C-8wzkwxOQY/", embedUrl: "", thumbnailUrl: "https://via.placeholder.com/900x600.png?text=IG+Reels+8", description: "Muhammad Yusran – Pappasang Karaeng Pattingalloang.", tags: ["IG", "Reels", "Sejarah"] },
    { id: "ig-short-9", title: "Mitologi Bumi Sulawesi - Abdi Mahesa", category: "Short Video (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C-vi3cWxVqu/", embedUrl: "", thumbnailUrl: "https://via.placeholder.com/900x600.png?text=IG+Reels+9", description: "Mitologi Bumi Sulawesi – Abdi Mahesa.", tags: ["IG", "Reels", "Budaya"] },
    { id: "ig-short-10", title: "Mitologi Bumi Sulawesi - Kemerdekaan Bajeng 14 Agustus 1945", category: "Short Video (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C-oNqH5x8A3/", embedUrl: "", thumbnailUrl: "https://via.placeholder.com/900x600.png?text=IG+Reels+10", description: "Mitologi Bumi Sulawesi – sejarah lokal.", tags: ["IG", "Reels", "Sejarah"] },
    { id: "ig-short-11", title: "Rian Fahardhi - Retna Kencana Colliq Pujie", category: "Short Video (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C-Cd5L9RwEr/", embedUrl: "", thumbnailUrl: "https://via.placeholder.com/900x600.png?text=IG+Reels+11", description: "Rian Fahardhi – tokoh perempuan Nusantara.", tags: ["IG", "Reels", "Tokoh"] },
    { id: "ig-short-12", title: "Aida Gunawan - Pergeseran Nilai Budaya Dalam Tradisi Pernikahan Adat Bugis Makassar", category: "Short Video (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C8mZAEGRVwX/", embedUrl: "", thumbnailUrl: "https://via.placeholder.com/900x600.png?text=IG+Reels+12", description: "Aida Gunawan – budaya Bugis Makassar.", tags: ["IG", "Reels", "Budaya"] },
    { id: "ig-short-13", title: "Rian Fahardhi - Pappasang Kajaolaliddong", category: "Short Video (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C7Vu1eXvT2I/", embedUrl: "", thumbnailUrl: "https://via.placeholder.com/900x600.png?text=IG+Reels+13", description: "Rian Fahardhi – Pappasang Kajaolaliddong.", tags: ["IG", "Reels", "Budaya"] },
    { id: "ig-short-14", title: "Mitologi Bumi Sulawesi - Tradisi Tumbilotohe", category: "Short Video (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C5hHsjdR0j0/", embedUrl: "", thumbnailUrl: "https://via.placeholder.com/900x600.png?text=IG+Reels+14", description: "Mitologi Bumi Sulawesi – Tradisi Tumbilotohe.", tags: ["IG", "Reels", "Budaya"] },
    // BUMPER EVENT IG
    { id: "ig-bumper-1", title: "Event Bumper Maujud Budaya Mitologi Bumi Sulawesi 2025", category: "Bumper Event (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/DBkCWiKx9IX/", embedUrl: "", thumbnailUrl: "", description: "Bumper event Maujud Budaya Mitologi Bumi Sulawesi 2025.", tags: ["IG", "Bumper", "Event"] },
    // FEED CAROUSEL IG
    { id: "ig-carousel-1", title: "Rian Fahardhi - Presence Before Evidence", category: "Feed Carousel (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/DR7Fwblkzj3/?img_index=1", thumbnailUrl: "", description: "Feed carousel Instagram.", tags: ["IG", "Carousel", "Rian Fahardhi"] },
    { id: "ig-carousel-2", title: "Mitologi Bumi Sulawesi - Sakralitas Pernikahan Adat Bugis Makassar", category: "Feed Carousel (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/DAWryILTHVO/?img_index=1", thumbnailUrl: "", description: "Feed carousel Instagram.", tags: ["IG", "Carousel", "Mitologi Bumi Sulawesi"] },
    { id: "ig-carousel-3", title: "Mitologi Bumi Sulawesi - Dialog Budaya Penggunaan Nama Dalam Tatanan Adat Budaya", category: "Feed Carousel (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C-24bm1zVjY/?img_index=1", thumbnailUrl: "", description: "Feed carousel Instagram.", tags: ["IG", "Carousel", "Dialog Budaya"] },
    { id: "ig-carousel-4", title: "Mitologi Bumi Sulawesi - Road to Campus Universitas Hasanuddin", category: "Feed Carousel (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C7lMTJJP9fi/?img_index=1", thumbnailUrl: "", description: "Feed carousel Instagram.", tags: ["IG", "Carousel", "Road to Campus"] },
    { id: "ig-carousel-5", title: "Mitologi Bumi Sulawesi - Road to School SMA Kartika XXI", category: "Feed Carousel (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C6P9axaPWsW/?img_index=1", thumbnailUrl: "", description: "Feed carousel Instagram.", tags: ["IG", "Carousel", "Road to School"] },
    // FLYER IG
    { id: "ig-flyer-1", title: "Event Flyer Maujud Budaya Mitologi Bumi Sulawesi 2025", category: "Flyer (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/DBdhcGgT5hr/", thumbnailUrl: "", description: "Flyer event Instagram.", tags: ["Design", "Flyer", "Event"] },
    { id: "ig-flyer-2", title: "Flyer Diskografi Dialog Budaya - Dimensi Spiritual Adat Budaya", category: "Flyer (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C_RQr9rzgdY/?img_index=1", thumbnailUrl: "", description: "Flyer diskografi Instagram.", tags: ["Design", "Flyer", "Dialog Budaya"] },
    { id: "ig-flyer-3", title: "Flyer Diskografi Dialog Budaya - Patron Kemerdekaan Bajeng 14 Agustus 1945", category: "Flyer (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C-fhr2qTYeo/?img_index=1", thumbnailUrl: "", description: "Flyer diskografi Instagram.", tags: ["Design", "Flyer", "Diskografi"] },
    { id: "ig-flyer-4", title: "Flyer Diskografi Dialog Budaya - Pergeseran Nilai Aru Dalam Prosesi Adat Budaya", category: "Flyer (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C7PBDabvd9i/?img_index=1", thumbnailUrl: "", description: "Flyer diskografi Instagram.", tags: ["Design", "Flyer", "Adat Budaya"] },
    { id: "ig-flyer-5", title: "Flyer Video Dokumenter - Menyuruk KITAB KUNO Sureq Galigo", category: "Flyer (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C9PuFNKzk_D/", thumbnailUrl: "", description: "Flyer dokumenter Instagram.", tags: ["Design", "Flyer", "Dokumenter"] },
    { id: "ig-flyer-6", title: "Flyer Video Dokumenter - Nene Mallomo Cedekiawan Bumi Sidenrereng", category: "Flyer (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C9FosgwTg4c/", thumbnailUrl: "", description: "Flyer dokumenter Instagram.", tags: ["Design", "Flyer", "Dokumenter"] },
    { id: "ig-flyer-7", title: "Flyer Video Dokumenter - Tradisi Tenun Sutra Wajo", category: "Flyer (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C9DHpFTT4cc/", thumbnailUrl: "", description: "Flyer dokumenter Instagram.", tags: ["Design", "Flyer", "Dokumenter"] },
    { id: "ig-flyer-8", title: "Flyer Video Dokumenter - Colliq Pujie Sang Penyalin Sureq I La Galigo", category: "Flyer (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C6SRH8hPN_V/", thumbnailUrl: "", description: "Flyer dokumenter Instagram.", tags: ["Design", "Flyer", "Dokumenter"] },
    { id: "ig-flyer-9", title: "Flyer Video Dokumenter - Passapu Simbol Peradaban Tertinggi", category: "Flyer (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C4AlRjDv30A/", thumbnailUrl: "", description: "Flyer dokumenter Instagram.", tags: ["Design", "Flyer", "Dokumenter"] },
    { id: "ig-flyer-10", title: "Flyer Video Dokumenter - Patorani Sang Penantang Badai", category: "Flyer (IG)", type: "link", sourceUrl: "https://www.instagram.com/p/C3kMW4yPWFu/", thumbnailUrl: "", description: "Flyer dokumenter Instagram.", tags: ["Design", "Flyer", "Dokumenter"] },
    // PHOTO DRIVE
    {
      id: "drv-photo-1", title: "Photo Project TNI AD – Graduation",
      category: "Photo", type: "drive_folder",
      sourceUrl: "https://drive.google.com/drive/folders/1lKmrGxu69Fm66yuQZM07aByAJBnc4Ebn",
      thumbnailUrl: "https://images.unsplash.com/photo-1520975682031-ae9f8b1b6f8d?q=80&w=1600&auto=format&fit=crop",
      description: "Dokumentasi photo project: TNI AD, graduation, dan event lainnya.",
      tags: ["Photo", "Documentation", "Event"],
      items: [
        { title: "Wisuda", type: "drive_subfolder", folderUrl: "https://drive.google.com/drive/folders/1mImrEceQaDmgpmAFFLBfkBrE_s5204f_?usp=drive_link" },
        { title: "TNI AD", type: "drive_subfolder", folderUrl: "https://drive.google.com/drive/folders/1H5j_LCo_GfBk-DIXrmQT0NeROp3coi3x?usp=drive_link" },
      ],
    },
    // POSTER DESIGN
    {
      id: "drv-poster-1", title: "Poster Design Collection",
      category: "Poster Design", type: "drive_folder",
      sourceUrl: "https://drive.google.com/drive/folders/14dy-y5rNIxAvgbJnwanLbl9ugIahNo-e?usp=drive_link",
      thumbnailUrl: "", description: "Koleksi poster design & feed visual campaign.",
      tags: ["Poster", "Design", "Visual"],
      items: [
        { title: "TikTok", sourceUrl: "https://drive.google.com/file/d/1fnLsoRmVMRl1nwfFrsXUsH6RAt-yO69J/view", embedUrl: "https://drive.google.com/file/d/1fnLsoRmVMRl1nwfFrsXUsH6RAt-yO69J/preview" },
        { title: "Thank God Black", sourceUrl: "https://drive.google.com/file/d/1SD0Rvd1UpEHUOOPPWOx4TRm1EL3QYiEw/view", embedUrl: "https://drive.google.com/file/d/1SD0Rvd1UpEHUOOPPWOx4TRm1EL3QYiEw/preview" },
        { title: "RUU Penyiaran", sourceUrl: "https://drive.google.com/file/d/1WLlSOWbJW85pnzIhCANfSv294fMSOzyA/view", embedUrl: "https://drive.google.com/file/d/1WLlSOWbJW85pnzIhCANfSv294fMSOzyA/preview" },
        { title: "Ramadan Sale", sourceUrl: "https://drive.google.com/file/d/10Xg5_FOlKc9737gb2qfE8devSDT8_hEj/view", embedUrl: "https://drive.google.com/file/d/10Xg5_FOlKc9737gb2qfE8devSDT8_hEj/preview" },
        { title: "Poster Orba", sourceUrl: "https://drive.google.com/file/d/1d0OGegvDLvFD23Ta6IOZTrPHclwsUESy/view", embedUrl: "https://drive.google.com/file/d/1d0OGegvDLvFD23Ta6IOZTrPHclwsUESy/preview" },
        { title: "Poster Idul Fitri", sourceUrl: "https://drive.google.com/file/d/10fHjoBL16wry_OU71s2OZuj4tbnqi923/view", embedUrl: "https://drive.google.com/file/d/10fHjoBL16wry_OU71s2OZuj4tbnqi923/preview" },
        { title: "Pertamix Poster", sourceUrl: "https://drive.google.com/file/d/1FKcw7YGgbAa4hF7HFKS2V3RTv5bV2iV4/view", embedUrl: "https://drive.google.com/file/d/1FKcw7YGgbAa4hF7HFKS2V3RTv5bV2iV4/preview" },
        { title: "Pemuda Penjilat", sourceUrl: "https://drive.google.com/file/d/11ldktLwo50p3pWcPliSItimBDzT79ZoB/view", embedUrl: "https://drive.google.com/file/d/11ldktLwo50p3pWcPliSItimBDzT79ZoB/preview" },
        { title: "Lunar", sourceUrl: "https://drive.google.com/file/d/1L5gtcL_tlb9LWNKIOHNgPtlc3to75-Kl/view", embedUrl: "https://drive.google.com/file/d/1L5gtcL_tlb9LWNKIOHNgPtlc3to75-Kl/preview" },
        { title: "Keep Me Insane", sourceUrl: "https://drive.google.com/file/d/1SgaeE5S9pmQfe94LS4HyDGj1Y6bodo7k/view", embedUrl: "https://drive.google.com/file/d/1SgaeE5S9pmQfe94LS4HyDGj1Y6bodo7k/preview" },
        { title: "Feed Hampir Mati", sourceUrl: "https://drive.google.com/file/d/16oCQ4hIvWnS21FnijL_ynG-J_ohGXxOf/view", embedUrl: "https://drive.google.com/file/d/16oCQ4hIvWnS21FnijL_ynG-J_ohGXxOf/preview" },
        { title: "9 Nyawa", sourceUrl: "https://drive.google.com/file/d/1HV6uVf7XZon3GzJDIgAdqKJfk_eypKMi/view", embedUrl: "https://drive.google.com/file/d/1HV6uVf7XZon3GzJDIgAdqKJfk_eypKMi/preview" },
      ],
    },
  ];

  const FEATURED_IDS = ["yt-1","yt-2","yt-5","ig-short-7","ig-bumper-1","ig-carousel-2","ig-flyer-7","drv-photo-1","drv-poster-1","drv-project-3"];
  const FEATURED_THUMBS = {
    "ig-short-7": "asset/thumb/ig-short-7.webp",
    "ig-bumper-1": "asset/thumb/ig-bumper-1.webp",
    "drv-photo-1": "asset/thumb/drv-photo-1.webp",
    "drv-poster-1": "asset/thumb/drv-poster-1.webp",
    "drv-project-3": "asset/thumb/drv-project-3.webp",
  };

  // ---- INSERT portfolio_items ----
  const rows = portfolioData.map((item, idx) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    type: item.type,
    source_url: item.sourceUrl || '',
    embed_url: item.embedUrl || '',
    thumbnail_url: item.thumbnailUrl || '',
    description: item.description || '',
    tags: item.tags || [],
    sort_order: idx,
    is_featured: FEATURED_IDS.includes(item.id),
    featured_thumb: FEATURED_THUMBS[item.id] || '',
  }));

  console.log(`📦 Inserting ${rows.length} portfolio items...`);
  const { data: insertedItems, error: itemsErr } = await supabase
    .from('portfolio_items')
    .upsert(rows, { onConflict: 'id' })
    .select();

  if (itemsErr) {
    console.error('❌ Error inserting portfolio items:', itemsErr);
    return;
  }
  console.log(`✅ ${rows.length} portfolio items inserted.`);

  // ---- INSERT portfolio_sub_items ----
  const subRows = [];
  portfolioData.forEach(item => {
    if (item.items && item.items.length) {
      item.items.forEach((sub, si) => {
        subRows.push({
          parent_id: item.id,
          title: sub.title,
          type: sub.type || 'drive_video',
          source_url: sub.sourceUrl || '',
          embed_url: sub.embedUrl || '',
          folder_url: sub.folderUrl || '',
          sort_order: si,
        });
      });
    }
  });

  if (subRows.length) {
    console.log(`📦 Inserting ${subRows.length} sub-items...`);
    const { error: subErr } = await supabase
      .from('portfolio_sub_items')
      .insert(subRows);

    if (subErr) {
      console.error('❌ Error inserting sub-items:', subErr);
      return;
    }
    console.log(`✅ ${subRows.length} sub-items inserted.`);
  }

  // ---- INSERT site_content defaults ----
  console.log('📦 Inserting site content defaults...');
  const { error: siteErr } = await supabase
    .from('site_content')
    .upsert([
      { key: 'profile_photo_hero', value: '' },
      { key: 'profile_photo_about', value: '' },
    ], { onConflict: 'key' });

  if (siteErr) {
    console.error('❌ Error inserting site content:', siteErr);
    return;
  }

  console.log('✅ Site content defaults inserted.');
  console.log('🎉 Migrasi selesai! Semua data berhasil dipindahkan ke Supabase.');
}

// Jalankan
migrateData();
