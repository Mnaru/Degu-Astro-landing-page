export const translations = {
  en: {
    meta: {
      title: 'Degu Studio',
      description: 'Fresh visuals to feed your ads & socials',
    },
    intro: {
      header1: 'DEGU',
      header2: 'STUDIO',
      body: 'Fresh visuals to feed<br>your ads & socials.',
      scrollHint: 'Scroll',
    },
    work: {
      menuLabel: 'Work',
      pages: {
        socialMedia: {
          title: 'Social media assets',
          imageAlt: 'Social media assets by Degu Studio',
          gallery: [
            'Social media campaign — vibrant lifestyle content',
            'Social media campaign — portrait format story',
            'Social media campaign — square post layout',
            'Social media campaign — wide banner format',
            'Social media campaign — vertical story creative',
            'Social media campaign — branded visual content',
          ],
        },
        productPhotography: {
          title: 'Product photography',
          imageAlt: 'Product photography by Degu Studio',
          gallery: [
            'Product photography — studio lighting setup',
            'Product photography — detail close-up',
            'Product photography — flat lay composition',
            'Product photography — lifestyle context',
            'Product photography — styled product scene',
          ],
        },
        keyVisuals: {
          title: 'Key Visuals & OOH',
          imageAlt: 'Key visuals and out-of-home advertising by Degu Studio',
          gallery: [
            'Key visual — wide format billboard design',
            'Key visual — outdoor advertising mockup',
          ],
        },
      },
    },
    outro: {
      header1: 'DROP US',
      header2: 'A LINE',
      body: "Don't be shy - send us an email and we'll get back to you.",
      emailButton: 'Email us',
      emailCopied: '💚 Email copied',
      teamImageAlt: 'Degu Studio team',
    },
    menu: {
      home: 'Home',
      work: 'Work',
      contact: 'Contact',
      close: 'Close menu',
    },
    nav: {
      home: 'Home',
      contact: 'Contact',
      cta: 'Email us',
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
      body: 'Vizualika reklamai ir<br>socialiniams tinklams.',
      scrollHint: 'Slinkite',
    },
    work: {
      menuLabel: 'Darbai',
      pages: {
        socialMedia: {
          title: 'Socialinių tinklų turinis',
          imageAlt: 'Socialinių tinklų turinis – Degu Studio',
          gallery: [
            'Socialinių tinklų kampanija — gyvenimo būdo turinys',
            'Socialinių tinklų kampanija — portreto formato istorija',
            'Socialinių tinklų kampanija — kvadratinis įrašas',
            'Socialinių tinklų kampanija — platus banerio formatas',
            'Socialinių tinklų kampanija — vertikali istorijos kūryba',
            'Socialinių tinklų kampanija — firminis vizualinis turinys',
          ],
        },
        productPhotography: {
          title: 'Produktų fotografija',
          imageAlt: 'Produktų fotografija – Degu Studio',
          gallery: [
            'Produktų fotografija — studijinis apšvietimas',
            'Produktų fotografija — detalių artimas vaizdas',
            'Produktų fotografija — plokščia kompozicija',
            'Produktų fotografija — gyvenimo būdo kontekstas',
            'Produktų fotografija — stilizuota produkto scena',
          ],
        },
        keyVisuals: {
          title: 'Key Visuals & OOH',
          imageAlt: 'Key visuals ir lauko reklama – Degu Studio',
          gallery: [
            'Key visual — platus stendo formatas',
            'Key visual — lauko reklamos maketas',
          ],
        },
      },
    },
    outro: {
      header1: 'PARAŠYK',
      header2: 'MUMS',
      body: 'Nebūk drovus – parašyk mums el. laišką ir mes susisieksime.',
      emailButton: 'Rašyk mums',
      emailCopied: '💚 Emeilas nukopijuotas!',
      teamImageAlt: 'Degu Studio komanda',
    },
    menu: {
      home: 'Pradžia',
      work: 'Darbai',
      contact: 'Kontaktai',
      close: 'Uždaryti meniu',
    },
    nav: {
      home: 'Į pradžią',
      contact: 'Parašyk mums',
      cta: 'Parašyk mums',
    },
    gallery: {
      close: 'Uždaryti galeriją',
    },
  },
} as const;

export type Locale = keyof typeof translations;
export type Translations = (typeof translations)[Locale];
