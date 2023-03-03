const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (userPrefersDark) {
    // Swap document icons to white versions to retain contrast
    document.getElementById("shortcuticon").href="../images/globe_box_optimised_white.svg";

    document.getElementById("github").src="../images/github_box_optimised_white.svg";
    document.getElementById("mail").src="../images/mail_box_optimised_white.svg";
    document.getElementById("itchdotio").src="../images/itchdotio_box_optimised_white.svg";
    document.getElementById("youtube").src="../images/youtube_box_optimised_white.svg";
    document.getElementById("linkedin").src="../images/linkedin_box_optimised_white.svg";
}