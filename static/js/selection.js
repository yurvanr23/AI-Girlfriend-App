function shadeColor(col, amt) {
        let usePound = false;
        if (col[0] === "#") {
            col = col.slice(1);
            usePound = true;
        }

        let num = parseInt(col, 16);
        let r = (num >> 16) + amt;
        let g = ((num >> 8) & 0x00FF) + amt;
        let b = (num & 0x0000FF) + amt;

        r = Math.min(255, Math.max(0, r));
        g = Math.min(255, Math.max(0, g));
        b = Math.min(255, Math.max(0, b));

        return (usePound ? "#" : "") + (b | (g << 8) | (r << 16)).toString(16).padStart(6,"0");
    }


    document.getElementById("sortSelect").addEventListener("change", sortList);



    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const waifuName = link.getAttribute("data-name");
            showWaifuOverview(waifuName);
        });
    });

    function showWaifuOverview(name) {
        const waifu = waifus[name];
        if (!waifu) return;

        // Apply Color Theme
        const theme = waifuThemes[name] || { color: "#8b5cf6", glow: "#c4b5fd" };

        const panel = document.getElementById("waifuOverview");
        panel.style.background = `linear-gradient(135deg, ${theme.glow}, #ffffff)`;

        // Name color
        document.getElementById("overviewName").style.color = theme.color;

        // Stats color accents
        document.querySelectorAll("#overviewStats").forEach(stat => {
            stat.style.background = `${theme.color}20`;
            stat.style.color = theme.color;
        });

        // Chat button
        const btn = document.getElementById("chatButton");
        btn.style.background = theme.color;
        btn.style.boxShadow = `0 6px 16px ${theme.color}55`;

        btn.onmouseenter = () => {
            btn.style.background = shadeColor(theme.color, -15);
        };
        btn.onmouseleave = () => {
            btn.style.background = theme.color;
        };

        // Image soft glow
        document.getElementById("overviewImg").style.boxShadow = `0 8px 22px ${theme.color}55`;


        const overview = document.getElementById("waifuOverview");
        overview.classList.remove("fade-slide");

        // Minimize sidebar
        //document.querySelector(".sidebar").classList.add("collapsed");

        // Populate info
        document.getElementById("overviewImg").src = waifu.img;
        document.getElementById("overviewName").textContent = waifu.name;
        document.getElementById("overviewDesc").textContent = waifu.description;

        const statsDiv = document.getElementById("overviewStats");
        statsDiv.innerHTML = "";
        for (const [key, value] of Object.entries(waifu.stats)) {
            statsDiv.innerHTML += `<div><strong>${key}:</strong> ${value}</div>`;
        }

        document.getElementById("chatButton").onclick = () => {
            window.location.href = `/index.html?waifu=${encodeURIComponent(name)}`;
        }

        void overview.offsetWidth;
        overview.classList.add("fade-slide");
    }

    function closeWaifuOverview() {
        document.querySelector(".sidebar").classList.remove("collapsed");
    }


    // Toggle Sidebar
    /*document.querySelector('.toggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('collapsed');
    });*/

    // Real-time Search
    const searchInput = document.getElementById("waifuSearch");
    const favouriteCheckbox = document.getElementById("filterFavourites");

    searchInput.addEventListener("input", filterList);
    favouriteCheckbox.addEventListener("change", filterList);

    /*searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const waifuLinks = document.querySelectorAll(".menu-link .nav-link");

        waifuLinks.forEach(link => {
            if (!dataName) return; // skip if missing

            const waifuName = link.textContent.toLowerCase();
            if (waifuName.includes(query)) {
                link.style.display = "flex";
            } else {
                link.style.display = "none";
            }
        });
    });*/

    // Favourites
    /*document.querySelectorAll(".favourite").forEach(star => {
        star.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            star.classList.toggle("favourited");
        });
    });*/

    function filterList() {
        const query = searchInput.value.toLowerCase();
        const showfavourites = favouriteCheckbox.checked;
        const links = document.querySelectorAll(".nav-link");

        links.forEach(link => {
            const name = link.getAttribute('data-name').toLowerCase();
            const isfavourite = localStorage.getItem('favourite_' + link.getAttribute('data-name')) === 'true';

            const matchesSearch = name.includes(query);
            const matchesfavourite = !showfavourites || isfavourite;

            link.style.display = matchesSearch && matchesfavourite ? "flex" : "none";
        });
    }

    function toggleFavourite(e, name) {
        e.stopPropagation();
        const key = 'favourite_' + name;
        const current = localStorage.getItem(key) === 'true';
        localStorage.setItem(key, !current);
        updatefavouriteIcons();
        filterList();
    }

    function updatefavouriteIcons() {
        document.querySelectorAll('.nav-link').forEach(link => {
            const name = link.getAttribute('data-name');
            const icon = link.querySelector('.favourite');
            if (localStorage.getItem('favourite_' + name) === 'true') {
                icon.classList.add('favourited');
            } else {
                icon.classList.remove('favourited');
            }
        });
    }

    updatefavouriteIcons();
    filterList();

    function sortList() {
        const sortType = document.getElementById("sortSelect").value;
        const ul = document.querySelector(".menu-link");
        const items = Array.from(ul.querySelectorAll(".nav-link"));

        // Extract name + popularity for sorting
        const detailedList = items.map(item => {
            const name = item.getAttribute("data-name");
            const pop = waifus[name]?.stats?.Popularity?.replace("%", "") || 0;
            return { element: item, name, pop: Number(pop) };
        });

        // Sorting logic
        if (sortType === "asc") {
            detailedList.sort((a, b) => a.name.localeCompare(b.name));
        } 
        else if (sortType === "desc") {
            detailedList.sort((a, b) => b.name.localeCompare(a.name));
        }
        else if (sortType === "popularity") {
            detailedList.sort((a, b) => b.pop - a.pop);
        }

        // Rebuild list
        ul.innerHTML = "";
        detailedList.forEach(item => ul.appendChild(item.element));

        // Re-apply search & favourites filter
        filterList();
    }


    // Keyboard navigation
    let currentIndex = -1;
    document.addEventListener('keydown', (e) => {
        const visibleItems = Array.from(document.querySelectorAll('.nav-link')).filter(item => item.style.display !== 'none');
        if (e.key === 'ArrowDown') {
            currentIndex = (currentIndex + 1) % visibleItems.length;
            visibleItems[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
            visibleItems[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    const waifus = {
    "Waguri Kaoruko": {
        name: "Waguri Kaoruko",
        img: "/static/images/waguri_pfp.jpg",
        description: "Calm, collected, and always thoughtful. She’ll quietly support you, but don’t underestimate her playful side when you least expect it.",
        stats: { Popularity: "92%", Intelligence: "88", Charm: "95" }
    },
    "Rin Tohsaka": {
        name: "Rin Tohsaka",
        img: "/static/images/rin_pfp.jpg",
        description: "Smart, confident, and a little competitive. She can tease you, but she’ll also be the first one in your corner when it matters.",
        stats: { Popularity: "97%", Intelligence: "90", Charm: "85" }
    },
    "Asuna Yuuki": {
        name: "Asuna Yuuki",
        img: "/static/images/asuna1_pfp.jpg",
        description: "Kind, reliable, and strong when it counts. She balances determination with warmth, making every day feel a little easier.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Yukino Yukinoshita": {
        name: "Yukino Yukinoshita",
        img: "/static/images/yukino_pfp.jpg",
        description: "Independent, sharp, and direct. She may seem distant at first, but her care runs deep once you get to know her.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Chinatsu Kano": {
        name: "Chinatsu Kano",
        img: "/static/images/chinatsu_pfp.jpg",
        description: "Bright, cheerful, and full of energy. She makes the small moments fun and has a knack for making you smile without trying.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Asuka Langley Soryu": {
        name: "Asuka Langley Soryu",
        img: "/static/images/asuka1_pfp.jpg",
        description: "Fiery, bold, and fiercely independent. She’s confident in everything she does and will challenge you—but in the best way.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Boa Hancock": {
        name: "Boa Hancock",
        img: "/static/images/boa_pfp.jpg",
        description: "Elegant and confident, she commands attention effortlessly. When she’s with someone she trusts, her warmth is undeniable.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Haruno Yukinoshita": {
        name: "Haruno Yukinoshita",
        img: "/static/images/haruno_pfp.jpg",
        description: "Practical, thoughtful, and occasionally blunt. She’ll give honest advice and cares more than she lets on.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Himeko Inaba": {
        name: "Himeko Inaba",
        img: "/static/images/inaba1_pfp.jpg",
        description: "Quiet and a little reserved, but surprisingly thoughtful. She notices the little things and makes you feel seen.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Makima": {
        name: "Makima",
        img: "/static/images/makima_pfp.jpg",
        description: "Mysterious, composed, and confident. She has a presence that’s hard to ignore and keeps you guessing in all the right ways.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Misato Katsuragi": {
        name: "Misato Katsuragi",
        img: "/static/images/misato_pfp.jpg",
        description: "Fun, spontaneous, and protective. She’s the type who makes life exciting but also makes you feel safe and cared for.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Reze": {
        name: "Reze",
        img: "/static/images/reze_pfp.jpg",
        description: "Friendly, gentle, and unpredictable in the best way. She’s easy to talk to and has a subtle charm that draws people in.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Alya": {
        name: "Alya",
        img: "/static/images/alya_pfp.jpg",
        description: "Elegant, composed, and sharper than she lets on. She has a teasing streak, but it’s subtle — the kind that makes conversations fun without ever feeling forced.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Kyouko Hori": {
        name: "Kyouko Hori",
        img: "/static/images/hori_pfp.jpg",
        description: "Warm, down-to-earth, and surprisingly responsible. She can keep everything together while still making the people around her feel at ease.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Emilia": {
        name: "Emilia",
        img: "/static/images/emilia_pfp.jpg",
        description: "Gentle, patient, and consistently kind. She has a softness that makes you want to protect her, but she’s stronger than she seems.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Echidna": {
        name: "Echidna",
        img: "/static/images/echidna_pfp.jpg",
        description: "Curious, clever, and always analyzing the world around her. She’s the type who enjoys deep conversations and seeing how people think.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Mai Sakurajima": {
        name: "Mai Sakurajima",
        img: "/static/images/mai_pfp.jpg",
        description: "Calm, mature, and incredibly grounded. She’s straightforward in the best way, with a quiet charm that makes her easy to connect with.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    "Anri Teieri": {
        name: "Anri Teieri",
        img: "/static/images/anri_pfp.jpg",
        description: "Confident and composed with a cool exterior, but surprisingly thoughtful once she opens up. She’s the reliable type who always stays centered.",
        stats: { Popularity: "99%", Power: "90", Charm: "100" }
    },
    // ... add others as needed
    };

    const waifuThemes = {
        "Waguri Kaoruko":   { color: "#a78bfa", glow: "#c4b5fd" },
        "Rin Tohsaka":      { color: "#ef4444", glow: "#f87171" },
        "Asuna Yuuki":      { color: "#f59e0b", glow: "#fbbf24" },
        "Yukino Yukinoshita": { color: "#60a5fa", glow: "#93c5fd" },
        "Chinatsu Kano":    { color: "#fb7185", glow: "#fda4af" },
        "Asuka Langley Soryu": { color: "#f97316", glow: "#fdba74" },
        "Boa Hancock":      { color: "#ec4899", glow: "#f9a8d4" },
        "Haruno Yukinoshita": { color: "#8b5cf6", glow: "#a78bfa" },
        "Himeko Inaba":     { color: "#22c55e", glow: "#4ade80" },
        "Makima":           { color: "#dc2626", glow: "#ef4444" },
        "Misato Katsuragi": { color: "#f43f5e", glow: "#fb7185" },
        "Reze":             { color: "#10b981", glow: "#34d399" },
        "Alya":             { color: "#3b82f6", glow: "#60a5fa" },
        "Kyouko Hori":      { color: "#f97316", glow: "#fdba74" },
        "Emilia":           { color: "#94a3b8", glow: "#cbd5e1" },
        "Echidna":          { color: "#6b7280", glow: "#9ca3af" },
        "Mai Sakurajima":   { color: "#6366f1", glow: "#818cf8" },
        "Anri Teieri":      { color: "#16a34a", glow: "#4ade80" }
    };