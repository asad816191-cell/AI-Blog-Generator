document.addEventListener("DOMContentLoaded", () => {
    const titleInput = document.getElementById("title");
    const generateBtn = document.getElementById("generateBtn");
    const loading = document.getElementById("loading");
    const resultSection = document.getElementById("resultSection");
    const blogOutput = document.getElementById("blogOutput");
    const blogTitle = document.getElementById("blogTitle");
    const wordCount = document.getElementById("wordCount");
    const readingTime = document.getElementById("readingTime");
    const totalWords = document.getElementById("totalWords");
    const readTime = document.getElementById("readTime");
    const headings = document.getElementById("headings");
    const copyBtn = document.getElementById("copyBtn");
    const pdfBtn = document.getElementById("pdfBtn");
    const wordBtn = document.getElementById("wordBtn");
    const regenBtn = document.getElementById("regenBtn");
    const themeBtn = document.querySelector(".theme-btn");
    const scrollBtn = document.querySelector(".scroll-top");
    const glow = document.querySelector(".cursor-glow");
    const toast = document.getElementById("toast");

    const API_URL = "/generate-blog";

    function showToast(message) {
        toast.innerText = message;
        toast.style.display = "block";
        toast.style.opacity = "1";

        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => {
                toast.style.display = "none";
            }, 300);
        }, 2500);
    }

    async function typeWriter(text) {
        blogOutput.innerHTML = "";
        const speed = 8;

        for (let i = 0; i < text.length; i += 1) {
            const char = text.charAt(i);
            blogOutput.innerHTML += char === "\n" ? "<br>" : char;
            blogOutput.scrollTop = blogOutput.scrollHeight;
            await new Promise((resolve) => setTimeout(resolve, speed));
        }
    }

    function updateStats(text) {
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const minutes = Math.max(1, Math.ceil(words / 200));
        const totalHeadings = (text.match(/^#/gm) || []).length;

        wordCount.innerText = `${words} Words`;
        readingTime.innerText = `${minutes} min read`;
        totalWords.innerText = words;
        readTime.innerText = minutes;
        headings.innerText = totalHeadings;
    }

    async function generateBlog() {
        const topic = titleInput.value.trim();
        if (!topic) {
            showToast("Please enter a topic.");
            return;
        }

        loading.style.display = "block";
        resultSection.style.display = "none";
        generateBtn.disabled = true;
        generateBtn.innerHTML = "Generating...";

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: topic, prompt: topic })
            });

            const data = await response.json();
            const blogContent = data.content || data.blog || "";
            if (!response.ok || !blogContent) {
                throw new Error(data.error || "Unable to generate blog");
            }

            blogTitle.innerText = data.title || topic;
            await typeWriter(blogContent);
            updateStats(blogContent);
            loading.style.display = "none";
            resultSection.style.display = "block";
            saveHistory(topic);
        } catch (error) {
            loading.style.display = "none";
            showToast("Server error. Please try again.");
            console.error(error);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate';
        }
    }

    function saveHistory(title) {
        const history = JSON.parse(localStorage.getItem("neoHistory") || "[]");
        const nextHistory = [title, ...history.filter((item) => item !== title)].slice(0, 10);
        localStorage.setItem("neoHistory", JSON.stringify(nextHistory));
        renderHistory();
    }

    function renderHistory() {
        const historyBox = document.querySelector(".history");
        if (!historyBox) return;

        const history = JSON.parse(localStorage.getItem("neoHistory") || "[]");
        historyBox.innerHTML = "";

        history.forEach((item) => {
            const div = document.createElement("div");
            div.className = "history-item";
            div.innerText = item;
            div.onclick = () => {
                titleInput.value = item;
                titleInput.focus();
            };
            historyBox.appendChild(div);
        });
    }

    generateBtn.addEventListener("click", generateBlog);

    titleInput.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            generateBlog();
        }
    });

    titleInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            generateBlog();
        }
    });

    titleInput.addEventListener("focus", () => {
        titleInput.parentElement.style.boxShadow = "0 0 35px rgba(0,212,255,.35)";
    });

    titleInput.addEventListener("blur", () => {
        titleInput.parentElement.style.boxShadow = "none";
    });

    titleInput.addEventListener("input", () => {
        if (titleInput.value.trim() === "") {
            blogOutput.innerHTML = "";
            resultSection.style.display = "none";
        }
    });

    document.querySelectorAll(".suggestions button").forEach((button) => {
        button.addEventListener("click", () => {
            titleInput.value = button.innerText;
            titleInput.focus();
        });
    });

    copyBtn.addEventListener("click", async () => {
        const text = blogOutput.innerText;
        if (!text) {
            showToast("Nothing to copy!");
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            showToast("Blog copied successfully.");
        } catch {
            showToast("Copy failed.");
        }
    });

    regenBtn.addEventListener("click", () => {
        if (titleInput.value.trim()) {
            generateBlog();
        }
    });

    wordBtn.addEventListener("click", () => {
        const text = blogOutput.innerText;
        if (!text) {
            showToast("Generate a blog first.");
            return;
        }

        const blob = new Blob([text], { type: "application/msword" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${blogTitle.innerText || "blog"}.doc`;
        link.click();
    });

    pdfBtn.addEventListener("click", () => {
        window.print();
    });

    themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
        themeBtn.innerHTML = document.body.classList.contains("light-mode")
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';
        showToast(document.body.classList.contains("light-mode") ? "Light Mode Enabled" : "Dark Mode Enabled");
    });

    window.addEventListener("scroll", () => {
        scrollBtn.style.display = window.scrollY > 300 ? "flex" : "none";
    });

    scrollBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.addEventListener("mousemove", (event) => {
        glow.style.left = `${event.clientX}px`;
        glow.style.top = `${event.clientY}px`;
    });

    window.addEventListener("load", () => {
        titleInput.focus();
        setTimeout(() => showToast("🚀 NeoWriter AI Ready"), 700);
    });

    renderHistory();
    scrollBtn.style.display = "none";
    console.log("✅ NeoWriter AI Loaded Successfully");
});
