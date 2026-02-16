export const translations = {
  en: {
    meta: {
      title: 'Degu Studio',
      description: 'Fresh visuals to feed your ads & socials',
    },
    intro: {
      header1: 'DEGU',
      header2: 'STUDIO',
      body: 'Fresh visuals to feed your ads & socials.',
      scrollHint: 'Scroll',
    },
    work: {
      menuLabel: 'Work',
      pages: {
        socialMedia: {
          title: 'Social media assets',
          imageAlt: 'Social media assets by Degu Studio',
        },
        productPhotography: {
          title: 'Product photography',
          imageAlt: 'Product photography by Degu Studio',
        },
        keyVisuals: {
          title: 'Key Visuals & OOH',
          imageAlt: 'Key visuals and out-of-home advertising by Degu Studio',
        },
      },
    },
    outro: {
      header1: 'DROP US',
      header2: 'A LINE',
      body: "Don't be shy - send us an email and we'll get back to you.",
      emailButton: 'Email us',
      emailCopied: 'Email copied',
      teamImageAlt: 'Degu Studio team',
    },
    menu: {
      home: 'Home',
      work: 'Work',
      contact: 'Contact',
    },
    gallery: {
      close: 'Close gallery',
    },
  },
  lt: {
    // TODO: Replace with actual Lithuanian translations
    meta: {
      title: 'Degu Studio',
      description: 'Vizualika reklamai ir socialiniams tinklams',
    },
    intro: {
      header1: 'DEGU',
      header2: 'STUDIO',
      body: 'Vizualika reklamai ir socialiniams tinklams.',
      scrollHint: 'Slinkite',
    },
    work: {
      menuLabel: 'Darbai',
      pages: {
        socialMedia: {
          title: 'Socialinių tinklų turinis',
          imageAlt: 'Socialinių tinklų turinis – Degu Studio',
        },
        productPhotography: {
          title: 'Produktų fotografija',
          imageAlt: 'Produktų fotografija – Degu Studio',
        },
        keyVisuals: {
          title: 'Key Visuals & OOH',
          imageAlt: 'Key visuals ir lauko reklama – Degu Studio',
        },
      },
    },
    outro: {
      header1: 'PARAŠYK',
      header2: 'MUMS',
      body: 'Nebūk drovus – parašyk mums el. laišką ir mes susisieksime.',
      emailButton: 'Rašyk mums',
      emailCopied: 'El. paštas nukopijuotas',
      teamImageAlt: 'Degu Studio komanda',
    },
    menu: {
      home: 'Pradžia',
      work: 'Darbai',
      contact: 'Kontaktai',
    },
    gallery: {
      close: 'Uždaryti galeriją',
    },
  },
} as const;

export type Locale = keyof typeof translations;
export type Translations = (typeof translations)[Locale];
