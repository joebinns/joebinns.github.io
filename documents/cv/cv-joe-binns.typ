#set document(title: "Joseph Alexander Binns", author: "Joseph Alexander Binns")
#let theme = sys.inputs.at("theme", default: "light")
#assert(("light", "dark").contains(theme), message: "theme must be light or dark")
// Match styles.css, including its darken/lighten tint overlays.
#let ink = rgb("090909")
#let cream = rgb("f8f0e3")
#let dark = theme == "dark"
// Use the original PDF's light palette with slightly darker body text.
#let heading-color = if dark { cream } else { black }
#let body-color = if dark { rgb("b2b2b2") } else { rgb("6f6c67") }
#let link-color = if dark { rgb("4169e1") } else { rgb("387dc9") }
#let rule-color = (if dark { heading-color } else { rgb("37352f") }).transparentize(90.98%)
#set page(width: 595.92pt, height: 842.88pt, margin: 0pt, fill: if dark { ink } else { cream })

// Bake the website's channel clamp into the vector icons as well.
#let tint(color) = {
  let channels = color.components(alpha: false)
  let lower = ink.components(alpha: false)
  let upper = cream.components(alpha: false)
  rgb(..range(3).map(i => calc.clamp(channels.at(i) / 1%, lower.at(i) / 1%, upper.at(i) / 1%) * 1%))
}
#let contact-icon(icon, alt) = {
  let svg = read("assets/icons/" + icon + ".svg")
  let tinted = svg.replace(regex("#[0-9a-fA-F]{6}"), match => tint(rgb(match.text)).to-hex())
  image(bytes(tinted), format: "svg", width: 13pt, height: 13pt, alt: alt)
}
#let line-height = 16.38pt
#let paragraph-gap = 21.84pt

#set text(
  font: "Inter",
  size: 10.92pt,
  fill: body-color,
  lang: "en",
  top-edge: "baseline",
  bottom-edge: "baseline",
  hyphenate: false,
  overhang: false,
)
#set par(leading: line-height, spacing: 0pt, linebreaks: "simple")
#set block(above: 0pt, below: 0pt)
#show link: it => text(fill: link-color,
  underline(stroke: 0.6825pt, offset: 1.02375pt, evade: false, it))
#show heading: set text(fill: heading-color, size: 16.38pt, weight: 600, tracking: -0.01em)
#show heading: set block(above: 0pt, below: 0pt)
// Notion uses slanted upright glyphs, rather than Inter's designed italics.
#show emph: it => text(font: "Inter Export", style: "italic", it.body)

#let paragraph(body) = block(width: 100%, body)
#let label(body) = text(fill: heading-color, weight: 700, body)
#let section-title(body) = heading(level: 1, outlined: false, body)
#let employer(url, body) = link(url)[@ #body]
#let role(title, dates, description: none) = {
  let parts = (paragraph(label(title)), line-height, paragraph(dates))
  if description != none {
    parts += (paragraph-gap, paragraph(description))
  }
  stack(spacing: 0pt, ..parts)
}
#let skill(title, body) = stack(
  spacing: 0pt,
  paragraph(label(title)),
  line-height,
  paragraph(body),
)
#let divider() = stack(
  spacing: 0pt,
  9.555pt,
  rect(width: 100%, height: 0.6825pt, fill: rule-color, stroke: none),
  31.395pt,
)

#let contact(icon, alt, body) = paragraph[
  #box(width: 19.7925pt, height: 0pt)[
    #place(top + left, dx: 0.32pt, dy: -10.17pt)[
      #contact-icon(icon, alt)
    ]
  ]#body
]

#place(top + left, dx: 72pt, dy: 97.935pt, block(width: 452.4975pt)[
  #stack(
    spacing: 0pt,
    paragraph(text(size: 27.3pt, weight: 700, fill: heading-color, tracking: -0.01em)[Joseph Alexander Binns]),
    40.95pt,
    paragraph(label[Game Developer and Computational Physicist]),
    line-height,
    paragraph[
      Exploring applications of machine learning to games, real-time simulations and large-scale interactive installations.
    ],
  )
])

#place(top + left, dx: 72pt, dy: 212.595pt, block(width: 452.4975pt)[
  #grid(
    columns: (289.38pt, 131.7225pt),
    column-gutter: 31.523pt,
    align: top,
    stack(
      spacing: 0pt,
      section-title[Employment],
      22.5225pt,
      role(
        [Interactive Experience Programmer #employer("https://sony.se/")[Sony]],
        [*Student* · #emph[Jul 2026 — Present · Lund, SE]],
        description: [Prototyping immersive installations using agentic workflows within the Advanced Content Creation team.],
      ),
      paragraph-gap,
      role(
        [Gameplay Programmer #employer("https://neatcorporation.com/")[Neat Corp]],
        [
          *Intermediate* · #emph[Nov 2025 — Mar 2026] \
          *Junior* · #emph[May 2024 — Nov 2025] \
          *Student* · #emph[Oct 2023 — May 2024 · Stockholm, SE]
        ],
        description: [
          Developed the online VR-fighter #link("https://www.meta.com/en-gb/experiences/crossings/7631852763493874/")[Crossings]
          (PC & Meta Quest) and ported #link("https://store.steampowered.com/app/1086850/Garden_of_the_Sea_VR/")[Garden of the Sea]
          from VR to flatscreen (PC, Nintendo Switch & Steam Deck).
        ],
      ),
      paragraph-gap,
      role(
        [Study Support Mentor #employer("https://www.fysik.lu.se/")[Lund University]],
        [#emph[Mar 2021 — Jun 2022 · Lund, SE]],
        description: [Provided one-to-one support for BSc Physics students on behalf of the university’s disability support service.],
      ),
      paragraph-gap,
      role(
        [Unity Developer Summer Intern #employer("https://mlabs.city/")[MLabs]],
        [#emph[Jul 2019 — Aug 2019 · London, UK]],
        description: [Built an urban environment simulation to support an automated transport planning system.],
      ),
      divider(),
      section-title[Education],
      22.5225pt,
      role(
        [MSc Computational Physics #employer("https://www.fysik.lu.se/")[Lund University]],
        [#emph[Aug 2026 — Jun 2028 · Lund, SE]],
      ),
      paragraph-gap,
      role(
        [YH Game Programmer #employer("https://futuregames.se/")[Futuregames]],
        [#emph[Aug 2022 — May 2024 · Stockholm, SE]],
      ),
      paragraph-gap,
      role(
        [BSc Theoretical Physics #employer("https://www.fysik.lu.se/")[Lund University]],
        [#emph[Aug 2019 — Jun 2022 · Lund, SE]],
        description: [Thesis explores #link("https://lup.lub.lu.se/student-papers/record/9088789")[Combined Regularisation Techniques for Artificial Neural Networks].],
      ),
    ),
    stack(
      spacing: 0pt,
      section-title[Contact],
      22.5225pt,
      contact("website", "🌍", link("https://joebinns.com/")[joebinns.com]),
      line-height,
      contact("linkedin", "👔", link("https://www.linkedin.com/in/joe-binns/")[LinkedIn]),
      line-height,
      contact("github", "🤖", link("https://github.com/joebinns")[GitHub]),
      line-height,
      contact("email", "✉️", link("mailto:hello@joebinns.com")[hello\@joebinns.com]),
      line-height,
      contact("phone", "☎️", link("tel:+46734624749")[+46 73 462 47 49]),
      line-height,
      contact("location", "📍", [Malmö, Sweden]),
      divider(),
      section-title[Technical Skills],
      22.5225pt,
      skill[Programming Fluency][C\#, Python, C++, C, HLSL, GLSL, JavaScript, LaTeX, HTML and CSS.],
      paragraph-gap,
      skill[Tools][Unity, Unreal Engine 5, Git, Perforce, Jenkins, Blender, Inkscape, Photoshop, Notion and LLMs.],
      paragraph-gap,
      skill[Libraries][TensorFlow, ML Kit, Unity Netcode, Three.js and LWJGL.],
      paragraph-gap,
      skill[Practical Skills][Circuitry, soldering, XR, Raspberry Pi and computer clusters.],
      divider(),
      section-title[References],
      paragraph-gap,
      paragraph[Available upon request.],
    ),
  )
])
