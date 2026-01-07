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
        
        // Dynamically set blurred background using the pfp image
        /*panel.style.backgroundImage = `url('${waifu.img}')`;
        panel.classList.add("blurred-bg");*/

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

        const tagsDiv = document.getElementById("overviewTags");
        tagsDiv.innerHTML = ""; 
        for (const [key, value] of Object.entries(waifu.tags)) {
            tagsDiv.innerHTML += `<div><strong>${key}:</strong> ${value}</div>`;
            
            // Optional: style the tags like stats
            const themeColor = theme.color;
            tagsDiv.lastChild.style.background = `${themeColor}20`; // semi-transparent bg
            tagsDiv.lastChild.style.color = themeColor;
            tagsDiv.lastChild.style.padding = "4px 8px";
            tagsDiv.lastChild.style.marginBottom = "4px";
            tagsDiv.lastChild.style.borderRadius = "6px";
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
        stats: { Popularity: "90%", Intelligence: "82", Charm: "95" },
        tags: { Profession: "High school student / Club helper", Height: "162 cm", MBTI: "ISFJ", Specialty: "Calm problem-solving", FunFact: "She remembers tiny details about people even when they forget." }
    },

    "Rin Tohsaka": {
        name: "Rin Tohsaka",
        img: "/static/images/rin_pfp.jpg",
        description: "Smart, confident, and a little competitive. She can tease you, but she’ll also be the first one in your corner when it matters.",
        stats: { Popularity: "98%", Intelligence: "95", Charm: "92" },
        tags: { Profession: "Mage / Master", Height: "159 cm", MBTI: "ENTJ", Specialty: "Jewel magic", FunFact: "Her financial management skills are terrifyingly good." }
    },

    "Asuna Yuuki": {
        name: "Asuna Yuuki",
        img: "/static/images/asuna1_pfp.jpg",
        description: "Kind, reliable, and strong when it counts. She balances determination with warmth, making every day feel a little easier.",
        stats: { Popularity: "99%", Intelligence: "88", Charm: "96" },
        tags: { Profession: "Sub-leader of the Knights of the Blood", Height: "168 cm", MBTI: "ESFJ", Specialty: "Rapier mastery", FunFact: "She’s one of the fastest players ever recorded in SAO." }
    },

    "Yukino Yukinoshita": {
        name: "Yukino Yukinoshita",
        img: "/static/images/yukino_pfp.jpg",
        description: "Independent, sharp, and direct. She may seem distant at first, but her care runs deep once you get to know her.",
        stats: { Popularity: "97%", Intelligence: "96", Charm: "94" },
        tags: { Profession: "Student council member", Height: "165 cm", MBTI: "INTJ", Specialty: "Cold logic & brutal honesty", FunFact: "Her tea brewing is practically a superpower." }
    },

    "Chinatsu Kano": {
        name: "Chinatsu Kano",
        img: "/static/images/chinatsu_pfp.jpg",
        description: "Bright, cheerful, and full of energy. She makes the small moments fun and has a knack for making you smile without trying.",
        stats: { Popularity: "85%", Intelligence: "78", Charm: "93" },
        tags: { Profession: "Track team ace", Height: "155 cm", MBTI: "ESFP", Specialty: "Endless energy", FunFact: "Can hype up an entire room without saying a word." }
    },

    "Asuka Langley Soryu": {
        name: "Asuka Langley Soryu",
        img: "/static/images/asuka1_pfp.jpg",
        description: "Fiery, bold, and fiercely independent. She’s confident in everything she does and will challenge you—but in the best way.",
        stats: { Popularity: "96%", Intelligence: "92", Charm: "89" },
        tags: { Profession: "Eva Pilot", Height: "157 cm", MBTI: "ENTP", Specialty: "Combat instincts", FunFact: "Capable of speaking German fluently since childhood." }
    },

    "Boa Hancock": {
        name: "Boa Hancock",
        img: "/static/images/boa_pfp.jpg",
        description: "Elegant and confident, she commands attention effortlessly. When she’s with someone she trusts, her warmth is undeniable.",
        stats: { Popularity: "100%", Intelligence: "86", Charm: "100" },
        tags: { Profession: "Empress of Amazon Lily", Height: "191 cm", MBTI: "ENFJ", Specialty: "Charm & Coercion", FunFact: "Her beauty is canonically recognized as a literal weapon." }
    },

    "Haruno Yukinoshita": {
        name: "Haruno Yukinoshita",
        img: "/static/images/haruno_pfp.jpg",
        description: "Practical, thoughtful, and occasionally blunt. She’ll give honest advice and cares more than she lets on.",
        stats: { Popularity: "92%", Intelligence: "90", Charm: "90" },
        tags: { Profession: "Corporate professional", Height: "167 cm", MBTI: "ENFJ", Specialty: "Reading people perfectly", FunFact: "She can change a room’s mood with one sentence." }
    },

    "Himeko Inaba": {
        name: "Himeko Inaba",
        img: "/static/images/inaba1_pfp.jpg",
        description: "Quiet and a little reserved, but surprisingly thoughtful. She notices the little things and makes you feel seen.",
        stats: { Popularity: "88%", Intelligence: "89", Charm: "91" },
        tags: { Profession: "Student / Club member", Height: "160 cm", MBTI: "ISTJ", Specialty: "Emotional awareness", FunFact: "Quietly pays attention to every small detail." }
    },

    "Makima": {
        name: "Makima",
        img: "/static/images/makima_pfp.jpg",
        description: "Mysterious, composed, and confident. She has a presence that’s hard to ignore and keeps you guessing in all the right ways.",
        stats: { Popularity: "100%", Intelligence: "100", Charm: "92" },
        tags: { Profession: "Public Safety Devil Hunter", Height: "173 cm", MBTI: "INTJ-A", Specialty: "Control", FunFact: "Always knows more than she lets on — always." }
    },

    "Misato Katsuragi": {
        name: "Misato Katsuragi",
        img: "/static/images/misato_pfp.jpg",
        description: "Fun, spontaneous, and protective. She’s the type who makes life exciting but also makes you feel safe and cared for.",
        stats: { Popularity: "95%", Intelligence: "84", Charm: "93" },
        tags: { Profession: "Nerv Operations Chief", Height: "168 cm", MBTI: "ENFP", Specialty: "Leadership under pressure", FunFact: "Known for mixing alcohol and responsibility seamlessly." }
    },

    "Reze": {
        name: "Reze",
        img: "/static/images/reze_pfp.jpg",
        description: "Friendly, gentle, and unpredictable in the best way. She’s easy to talk to and has a subtle charm that draws people in.",
        stats: { Popularity: "94%", Intelligence: "88", Charm: "88" },
        tags: { Profession: "Agent / Fighter", Height: "165 cm", MBTI: "ISFP", Specialty: "Flexibility & charm", FunFact: "She can make almost anyone feel comfortable instantly." }
    },

    "Alya": {
        name: "Alya",
        img: "/static/images/alya_pfp.jpg",
        description: "Elegant, composed, and sharper than she lets on. She has a teasing streak, but it’s subtle — the kind that makes conversations fun without ever feeling forced.",
        stats: { Popularity: "93%", Intelligence: "87", Charm: "97" },
        tags: { Profession: "Journalist / Photographer", Height: "163 cm", MBTI: "ENTP", Specialty: "Observation & strategy", FunFact: "Always knows the perfect moment to tease you." }
    },

    "Kyouko Hori": {
        name: "Kyouko Hori",
        img: "/static/images/hori_pfp.jpg",
        description: "Warm, down-to-earth, and surprisingly responsible. She can keep everything together while still making the people around her feel at ease.",
        stats: { Popularity: "95%", Intelligence: "85", Charm: "94" },
        tags: { Profession: "Student / Club President", Height: "160 cm", MBTI: "ESFJ", Specialty: "Organization & support", FunFact: "Can handle chaos while staying cheerful." }
    },

    "Emilia": {
        name: "Emilia",
        img: "/static/images/emilia_pfp.jpg",
        description: "Gentle, patient, and consistently kind. She has a softness that makes you want to protect her, but she’s stronger than she seems.",
        stats: { Popularity: "98%", Intelligence: "83", Charm: "95" },
        tags: { Profession: "Half-elf / Royal figure", Height: "165 cm", MBTI: "INFJ", Specialty: "Healing & empathy", FunFact: "Can communicate with spirits and animals effortlessly." }
    },

    "Echidna": {
        name: "Echidna",
        img: "/static/images/echidna_pfp.jpg",
        description: "Curious, clever, and always analyzing the world around her. She’s the type who enjoys deep conversations and seeing how people think.",
        stats: { Popularity: "90%", Intelligence: "100", Charm: "98" },
        tags: { Profession: "Witch / Scholar", Height: "170 cm", MBTI: "INTP", Specialty: "Knowledge & analysis", FunFact: "Never stops studying, even while relaxing." }
    },

    "Mai Sakurajima": {
        name: "Mai Sakurajima",
        img: "/static/images/mai_pfp.jpg",
        description: "Calm, mature, and incredibly grounded. She’s straightforward in the best way, with a quiet charm that makes her easy to connect with.",
        stats: { Popularity: "99%", Intelligence: "90", Charm: "98" },
        tags: { Profession: "Actress / Student", Height: "167 cm", MBTI: "ISFP", Specialty: "Poise & composure", FunFact: "She can go unnoticed despite being famous." }
    },

    "Anri Teieri": {
        name: "Anri Teieri",
        img: "/static/images/anri_pfp.jpg",
        description: "Confident and composed with a cool exterior, but surprisingly thoughtful once she opens up. She’s the reliable type who always stays centered.",
        stats: { Popularity: "99%", Intelligence: "90", Charm: "100" },
        tags: { Profession: "Student council / Athlete", Height: "166 cm", MBTI: "ISTJ", Specialty: "Calm reliability", FunFact: "Can plan entire events perfectly alone." }
    },

    "Isuzu Sento": {
        name: "Isuzu Sento",
        img: "/static/images/sento_pfp.jpg",
        description: "Disciplined, sharp, and stoic—Isuzu carries herself like a soldier, but beneath the formality she has a quiet softness reserved for the people she trusts. Serious on the outside, sincere on the inside.",
        stats: { Popularity: "93%", Intelligence: "92", Charm: "88" },
        tags: { Profession: "Martial artist / Student", Height: "161 cm", MBTI: "ISTJ", Specialty: "Discipline & combat", FunFact: "Can memorize strict rules and follow them flawlessly." }
    },

    "Orihime Inoue": {
        name: "Orihime Inoue",
        img: "/static/images/orihime_pfp.jpg",
        description: "Kind-hearted, gentle, and surprisingly quirky. Orihime’s warmth makes people feel instantly at ease, and her optimism is strong enough to pull anyone out of a bad day.",
        stats: { Popularity: "97%", Intelligence: "85", Charm: "95" },
        tags: { Profession: "Student / Healer", Height: "166 cm", MBTI: "ENFP", Specialty: "Healing & support", FunFact: "Can literally create small miracles with her powers." }
    },

    "Rukia Kuchiki": {
        name: "Rukia Kuchiki",
        img: "/static/images/rukia_pfp.jpg",
        description: "Composed, witty, and quietly caring. Rukia may appear reserved, but she has a dry sense of humor and a dependable strength that anchors everyone around her.",
        stats: { Popularity: "98%", Intelligence: "94", Charm: "90" },
        tags: { Profession: "Shinigami / Officer", Height: "158 cm", MBTI: "ISTJ", Specialty: "Soul reaping & strategy", FunFact: "Her serious demeanor hides a soft spot for friends." }
    },

    "Soifon": {
        name: "Soi Fon",
        img: "/static/images/soifon_pfp.jpg",
        description: "Focused, loyal, and fiercely determined. Soi Fon gives everything her full effort, and though she keeps her guard up, her dedication speaks louder than words.",
        stats: { Popularity: "91%", Intelligence: "96", Charm: "84" },
        tags: { Profession: "Assassin / Captain", Height: "158 cm", MBTI: "ISTJ", Specialty: "Stealth & speed", FunFact: "She trains so hard she forgets to rest sometimes." }
    },

    "Chizuru Mizuhara": {
        name: "Chizuru Mizuhara",
        img: "/static/images/chizuru_pfp.jpg",
        description: "Polished, ambitious, and effortlessly charismatic. Chizuru knows how to present herself with grace—on and off the stage.",
        stats: { Popularity: "98%", Intelligence: "89", Charm: "100" },
        tags: { Profession: "Actress / Student", Height: "164 cm", MBTI: "ENTJ", Specialty: "Charisma & presentation", FunFact: "She can make everyone believe she’s perfect, effortlessly." }
    },

    "Akane Kurokawa": {
        name: "Akane Kurokawa",
        img: "/static/images/akane_pfp.jpg",
        description: "Soft-spoken, hardworking, and deeply perceptive. Akane understands people on an emotional level and adapts with ease.",
        stats: { Popularity: "93%", Intelligence: "91", Charm: "96" },
        tags: { Profession: "Student / Athlete", Height: "159 cm", MBTI: "ISFJ", Specialty: "Empathy & adaptability", FunFact: "She can sense the moods of others without them saying a word." }
    },

    "Erina Nakiri": {
        name: "Erina Nakiri",
        img: "/static/images/erina_pfp.jpg",
        description: "Refined, confident, and sharp-tongued, but capable of genuine kindness. Erina’s poise and talent speak louder than words.",
        stats: { Popularity: "97%", Intelligence: "95", Charm: "92" },
        tags: { Profession: "Chef / Student", Height: "163 cm", MBTI: "ENTJ", Specialty: "Cooking mastery", FunFact: "Her tongue is called the 'God Tongue' for a reason." }
    },

    "Son Goku": {
        name: "Son Goku",
        img: "/static/images/goku_pfp.jpg",
        description: "Pure-hearted, upbeat, and battle-smart. Goku may not ace written tests, but his instinct, courage, and friendly charm are unbeatable.",
        stats: { Popularity: "100%", Intelligence: "65", Charm: "75" },
        tags: { Profession: "Martial artist / Saiyan", Height: "175 cm", MBTI: "ESFP", Specialty: "Fighting & survival instincts", FunFact: "Can eat an absurd amount of food without gaining weight." }
    },

    "Maki Oze": {
        name: "Maki Oze",
        img: "/static/images/maki_pfp.jpg",
        description: "Strong, loyal, and surprisingly shy despite her power. Maki is dependable, hardworking, and tries her best—even when flustered.",
        stats: { Popularity: "92%", Intelligence: "85", Charm: "91" },
        tags: { Profession: "Firefighter", Height: "168 cm", MBTI: "ISFJ", Specialty: "Strength & loyalty", FunFact: "Despite her strength, she’s very gentle with animals." }
    },

    "Nagisa Natsunagi": {
        name: "Nagisa Natsunagi",
        img: "/static/images/nagisa_pfp.jpg",
        description: "Bright, cheerful, and empathetic. Nagisa brings emotional warmth wherever she goes, even when things get complicated.",
        stats: { Popularity: "90%", Intelligence: "80", Charm: "94" },
        tags: { Profession: "Student / Friend", Height: "158 cm", MBTI: "ENFP", Specialty: "Cheerfulness & empathy", FunFact: "Can make friends instantly with her positive energy." }
    },

    "Siesta": {
        name: "Siesta",
        img: "/static/images/siesta_pfp.jpg",
        description: "Calm, sharp, and effortlessly elegant. Siesta solves problems with a smile and confidence that makes everything feel under control.",
        stats: { Popularity: "94%", Intelligence: "98", Charm: "93" },
        tags: { Profession: "Maid / Detective", Height: "160 cm", MBTI: "ISTJ", Specialty: "Problem-solving & observation", FunFact: "She can multitask like nobody else without breaking a sweat." }
    }

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
        "Anri Teieri":      { color: "#16a34a", glow: "#4ade80" },
        "Isuzu Sento":      { color: "#1e3a8a", glow: "#3b82f6" },
        "Orihime Inoue":    { color: "#fca5a5", glow: "#fecaca" },
        "Rukia Kuchiki":    { color: "#64748b", glow: "#94a3b8" },
        "Soi Fon":          { color: "#eab308", glow: "#facc15" },
        "Siesta":           { color: "#60a5fa", glow: "#93c5fd" },     // cool detective blue-white
        "Nagisa":           { color: "#f472b6", glow: "#f9a8d4" },     // soft pink, gentle vibe
        "Maki":             { color: "#ef4444", glow: "#f87171" },     // fire-themed red
        "Goku":             { color: "#f97316", glow: "#fdba74" },     // iconic orange
        "Erina":            { color: "#facc15", glow: "#fde047" },     // gourmet gold
        "Akane":            { color: "#a855f7", glow: "#c084fc" },     // stage/purple spotlight tone
        "Chizuru":          { color: "#ec4899", glow: "#f9a8d4" }      // classy romantic pink

    };