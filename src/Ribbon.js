const ribbon = document.getElementById("ribbon");

if (ribbon)
{
    const values = [
        "Hire Me! 🚀",
        "Open to Work 👀💼",
        "Recruiters Welcome! 🤝",
        "Looking for my Next Role 🔍",
        "Let's Work Together! 😃😌",
        "Opportunities Encouraged! 🪜",
        "Now Accepting Cool Jobs 📡"
    ];

    const randomIndex = Math.floor(Math.random() * values.length);
    ribbon.textContent = values[randomIndex];
    ribbon.hidden = false;
}

