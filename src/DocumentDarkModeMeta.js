const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (userPrefersDark) {
    // Swap document icons to white versions to retain contrast
    document.getElementById("websiteProj").src="/images/globe_box_optimised_white.svg";
    document.getElementById("itchdotioProj").src="/images/itchdotio_box_optimised_white.svg";
    document.getElementById("steamProj").src="/images/steam_box_white.svg";
    document.getElementById("githubProj").src="/images/github_box_optimised_white.svg";
    document.getElementById("youtubeProj").src="/images/youtube_box_optimised_white.svg";
    document.getElementById("documentProj").src="/images/document_box_white.svg";
}