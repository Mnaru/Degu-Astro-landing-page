export const translations = {
  en: {
    meta: {
      title: 'Degu Studio',
      description: 'Fresh visuals to feed your socials',
    },
    intro: {
      header1: 'DEGU',
      header2: 'STUDIO',
      body: 'Fresh visuals to<br>feed your socials.',
      scrollHint: 'Scroll',
    },
    outro: {
      header1: 'DROP US',
      header2: 'A LINE',
      body: "Don't be shy - send us an email<br>and we'll get back to you.",
      emailButton: 'Email us',
      emailCopied: '💚 Email copied',
      followButton: 'Follow us',
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
    review: {
      quote: '"Very fun to work with"',
      source: 'Anonymous survey, 2025',
    },
    aboutVideo: {
      text1: 'Degu is a content production studio in Vilnius, Lithuania, with a big thing for making drinks and products look incredible on social media.',
      text2: 'We shoot photo and video for beverage, beauty, and e-commerce brands — people like Eckes Granini, Alita, Manilla, and Bottlery. From concept to final cut, we move fast without cutting corners.',
    },
    galleries: {
      bottlery: { name: 'BOTTLERY', jobDone: 'Social media assets' },
      manilla: { name: 'MANILLA', jobDone: 'Product Photography' },
      'eckes-granini': { name: 'ECKES GRANINI', jobDone: 'Social media assets' },
      alita: { name: 'ALITA', jobDone: 'Social media assets' },
      open24: { name: 'OPEN24', jobDone: 'Social media assets' },
      'alita-2': { name: 'ALITA', jobDone: 'Social media assets' },
      close: 'Close',
      view: 'View',
    },
    footer: {
      ticker: "LET'S WORK TOGETHER",
      heading: 'Drop us a message',
      tagline: 'Fresh visuals to feed\nyour socials.',
      contactLabel: 'CONTACT',
      email: 'info@degu.lt',
      connectLabel: 'CONNECT',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      copyrightPrefix: '© Degu Studio, 2026. Site: ',
      copyrightSuffix: '',
      location: 'Vilnius, Lithuania',
      brandImageAlt: 'DEGUSTUDIO',
    },
  },
  lt: {
    // TODO: Replace with actual Lithuanian translations
    meta: {
      title: 'Degu Studio',
      description: 'Švieži vizualai jūsų socialiniams tinklams',
    },
    intro: {
      header1: 'DEGU',
      header2: 'STUDIO',
      body: '<span class="lt-body-sm">Švieži vizualai<br>jūsų socialiniams<br>tinklams.</span><span class="lt-body-lg">Švieži vizualai jūsų<br>socialiniams tinklams.</span>',
      scrollHint: 'Slinkite',
    },
    outro: {
      header1: 'PARAŠYK',
      header2: 'MUMS',
      body: 'Nebūk drovus – parašyk mums<br>el. laišką ir mes susisieksime.',
      emailButton: 'Rašyk mums',
      emailCopied: '💚 Emeilas nukopijuotas!',
      followButton: 'Sekite mus',
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
    review: {
      quote: '"SU JAIS LABAI FAINA DIRBTI"',
      source: 'Anoniminė apklausa, 2025',
    },
    aboutVideo: {
      text1: 'Degu – socialinio turinio studija Vilniuje. Fotografuojame ir filmuojame socialinių tinklų turinį gėrimų, grožio ir e-komercijos prekių ženklams, tokiems kaip Eckes Granini, Alita, Manilla ir Bottlery.',
      text2: 'Nuo koncepto iki galutinio montažo pasirūpiname, kad jūsų produktas atrodytų puikiai tiek gyvenime, tiek internete.',
    },
    galleries: {
      bottlery: { name: 'BOTTLERY', jobDone: 'Socialinių tinklų turinis' },
      manilla: { name: 'MANILLA', jobDone: 'Produktų fotografija' },
      'eckes-granini': { name: 'ECKES GRANINI', jobDone: 'Socialinių tinklų turinis' },
      alita: { name: 'ALITA', jobDone: 'Socialinių tinklų turinis' },
      open24: { name: 'OPEN24', jobDone: 'Socialinių tinklų turinis' },
      'alita-2': { name: 'ALITA', jobDone: 'Socialinių tinklų turinis' },
      close: 'Uždaryti',
      view: 'Žiūrėti',
    },
    footer: {
      ticker: 'DIRBKIM KARTU?',
      heading: 'Parašyk mums',
      tagline: 'Švieži vizualai jūsų\nsocialiniams tinklams.',
      contactLabel: 'KONTAKTAI',
      email: 'info@degu.lt',
      connectLabel: 'SEK MUS',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      copyrightPrefix: '© Degu Studio, 2026. Svetainė: ',
      copyrightSuffix: '',
      location: 'Vilnius, Lietuva',
      brandImageAlt: 'DEGUSTUDIO',
    },
  },
} as const;

export type Locale = keyof typeof translations;
export type Translations = (typeof translations)[Locale];
