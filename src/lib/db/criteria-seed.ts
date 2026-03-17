import { getDb } from './index';

type CriterionRow = [
  code: string,
  name: string,
  level: string,
  chapter_section: string,
  wcag_version: string,
  description: string,
];

function getEditions(wcag_version: string): string[] {
  if (wcag_version === '2.2') return ['WCAG', 'INT'];
  if (wcag_version === '2.1') return ['WCAG', 'EU', 'INT'];
  return ['WCAG', '508', 'EU', 'INT'];
}

const WCAG_CRITERIA: CriterionRow[] = [
  [
    '1.1.1',
    'Non-text Content',
    'A',
    'Perceivable',
    '2.0',
    'All non-text content has a text alternative.',
  ],
  [
    '1.2.1',
    'Audio-only and Video-only (Prerecorded)',
    'A',
    'Perceivable',
    '2.0',
    'Prerecorded audio-only and video-only content has an alternative.',
  ],
  [
    '1.2.2',
    'Captions (Prerecorded)',
    'A',
    'Perceivable',
    '2.0',
    'Captions are provided for prerecorded audio in synchronized media.',
  ],
  [
    '1.2.3',
    'Audio Description or Media Alternative (Prerecorded)',
    'A',
    'Perceivable',
    '2.0',
    'An alternative or audio description is provided for prerecorded video.',
  ],
  [
    '1.2.4',
    'Captions (Live)',
    'AA',
    'Perceivable',
    '2.0',
    'Captions are provided for live audio in synchronized media.',
  ],
  [
    '1.2.5',
    'Audio Description (Prerecorded)',
    'AA',
    'Perceivable',
    '2.0',
    'Audio description is provided for prerecorded video content.',
  ],
  [
    '1.2.6',
    'Sign Language (Prerecorded)',
    'AAA',
    'Perceivable',
    '2.0',
    'Sign language interpretation is provided for prerecorded audio.',
  ],
  [
    '1.2.7',
    'Extended Audio Description (Prerecorded)',
    'AAA',
    'Perceivable',
    '2.0',
    'Extended audio description is provided for prerecorded video.',
  ],
  [
    '1.2.8',
    'Media Alternative (Prerecorded)',
    'AAA',
    'Perceivable',
    '2.0',
    'A media alternative is provided for all prerecorded synchronized media.',
  ],
  [
    '1.2.9',
    'Audio-only (Live)',
    'AAA',
    'Perceivable',
    '2.0',
    'A text alternative is provided for live audio-only content.',
  ],
  [
    '1.3.1',
    'Info and Relationships',
    'A',
    'Perceivable',
    '2.0',
    'Information, structure, and relationships conveyed through presentation can be programmatically determined.',
  ],
  [
    '1.3.2',
    'Meaningful Sequence',
    'A',
    'Perceivable',
    '2.0',
    'The reading sequence of content can be programmatically determined.',
  ],
  [
    '1.3.3',
    'Sensory Characteristics',
    'A',
    'Perceivable',
    '2.0',
    'Instructions do not rely solely on sensory characteristics.',
  ],
  [
    '1.3.4',
    'Orientation',
    'AA',
    'Perceivable',
    '2.1',
    'Content does not restrict its view and operation to a single display orientation.',
  ],
  [
    '1.3.5',
    'Identify Input Purpose',
    'AA',
    'Perceivable',
    '2.1',
    'The purpose of each input field can be programmatically determined.',
  ],
  [
    '1.3.6',
    'Identify Purpose',
    'AAA',
    'Perceivable',
    '2.1',
    'The purpose of UI components, icons, and regions can be programmatically determined.',
  ],
  [
    '1.4.1',
    'Use of Color',
    'A',
    'Perceivable',
    '2.0',
    'Color is not used as the only visual means of conveying information.',
  ],
  [
    '1.4.2',
    'Audio Control',
    'A',
    'Perceivable',
    '2.0',
    'Audio that plays automatically can be paused, stopped, or muted.',
  ],
  [
    '1.4.3',
    'Contrast (Minimum)',
    'AA',
    'Perceivable',
    '2.0',
    'Text and images of text have a contrast ratio of at least 4.5:1.',
  ],
  [
    '1.4.4',
    'Resize Text',
    'AA',
    'Perceivable',
    '2.0',
    'Text can be resized without assistive technology up to 200% without loss of content.',
  ],
  [
    '1.4.5',
    'Images of Text',
    'AA',
    'Perceivable',
    '2.0',
    'Images of text are only used for decoration or where a specific presentation is essential.',
  ],
  [
    '1.4.6',
    'Contrast (Enhanced)',
    'AAA',
    'Perceivable',
    '2.0',
    'Text has a contrast ratio of at least 7:1.',
  ],
  [
    '1.4.7',
    'Low or No Background Audio',
    'AAA',
    'Perceivable',
    '2.0',
    'Prerecorded audio-only content has no background sound or it can be turned off.',
  ],
  [
    '1.4.8',
    'Visual Presentation',
    'AAA',
    'Perceivable',
    '2.0',
    'Foreground and background colors can be selected by the user for blocks of text.',
  ],
  [
    '1.4.9',
    'Images of Text (No Exception)',
    'AAA',
    'Perceivable',
    '2.0',
    'Images of text are used for decoration only or where essential.',
  ],
  [
    '1.4.10',
    'Reflow',
    'AA',
    'Perceivable',
    '2.1',
    'Content can be presented without loss of information at 400% zoom without horizontal scrolling.',
  ],
  [
    '1.4.11',
    'Non-text Contrast',
    'AA',
    'Perceivable',
    '2.1',
    'UI components and graphical objects have a contrast ratio of at least 3:1.',
  ],
  [
    '1.4.12',
    'Text Spacing',
    'AA',
    'Perceivable',
    '2.1',
    'No loss of content when letter/word/line spacing is overridden.',
  ],
  [
    '1.4.13',
    'Content on Hover or Focus',
    'AA',
    'Perceivable',
    '2.1',
    'Content that appears on hover or focus is dismissable, hoverable, and persistent.',
  ],
  [
    '2.1.1',
    'Keyboard',
    'A',
    'Operable',
    '2.0',
    'All functionality is operable through a keyboard interface.',
  ],
  [
    '2.1.2',
    'No Keyboard Trap',
    'A',
    'Operable',
    '2.0',
    'Keyboard focus can be moved away from any component using standard keys.',
  ],
  [
    '2.1.3',
    'Keyboard (No Exception)',
    'AAA',
    'Operable',
    '2.0',
    'All functionality is operable through a keyboard without requiring specific timings.',
  ],
  [
    '2.1.4',
    'Character Key Shortcuts',
    'A',
    'Operable',
    '2.1',
    'Single character keyboard shortcuts can be turned off or remapped.',
  ],
  [
    '2.2.1',
    'Timing Adjustable',
    'A',
    'Operable',
    '2.0',
    'Time limits can be turned off, adjusted, or extended.',
  ],
  [
    '2.2.2',
    'Pause, Stop, Hide',
    'A',
    'Operable',
    '2.0',
    'Moving, blinking, or scrolling content can be paused, stopped, or hidden.',
  ],
  [
    '2.2.3',
    'No Timing',
    'AAA',
    'Operable',
    '2.0',
    'Timing is not an essential part of any activity.',
  ],
  [
    '2.2.4',
    'Interruptions',
    'AAA',
    'Operable',
    '2.0',
    'Interruptions can be postponed or suppressed.',
  ],
  [
    '2.2.5',
    'Re-authenticating',
    'AAA',
    'Operable',
    '2.0',
    'Data is preserved when an authenticated session expires.',
  ],
  [
    '2.2.6',
    'Timeouts',
    'AAA',
    'Operable',
    '2.1',
    'Users are warned about timeouts that could cause data loss.',
  ],
  [
    '2.3.1',
    'Three Flashes or Below Threshold',
    'A',
    'Operable',
    '2.0',
    'Content does not flash more than three times per second.',
  ],
  [
    '2.3.2',
    'Three Flashes',
    'AAA',
    'Operable',
    '2.0',
    'Content does not flash more than three times per second (no threshold exception).',
  ],
  [
    '2.3.3',
    'Animation from Interactions',
    'AAA',
    'Operable',
    '2.1',
    'Motion animation triggered by interaction can be disabled.',
  ],
  [
    '2.4.1',
    'Bypass Blocks',
    'A',
    'Operable',
    '2.0',
    'A mechanism is available to bypass blocks of content repeated on multiple pages.',
  ],
  [
    '2.4.2',
    'Page Titled',
    'A',
    'Operable',
    '2.0',
    'Web pages have titles that describe topic or purpose.',
  ],
  [
    '2.4.3',
    'Focus Order',
    'A',
    'Operable',
    '2.0',
    'Focus order preserves meaning and operability.',
  ],
  [
    '2.4.4',
    'Link Purpose (In Context)',
    'A',
    'Operable',
    '2.0',
    'The purpose of each link can be determined from the link text or context.',
  ],
  [
    '2.4.5',
    'Multiple Ways',
    'AA',
    'Operable',
    '2.0',
    'More than one way to locate a page within a set of pages.',
  ],
  [
    '2.4.6',
    'Headings and Labels',
    'AA',
    'Operable',
    '2.0',
    'Headings and labels describe topic or purpose.',
  ],
  ['2.4.7', 'Focus Visible', 'AA', 'Operable', '2.0', 'Keyboard focus indicator is visible.'],
  [
    '2.4.8',
    'Location',
    'AAA',
    'Operable',
    '2.0',
    "Information about the user's location within a set of pages is available.",
  ],
  [
    '2.4.9',
    'Link Purpose (Link Only)',
    'AAA',
    'Operable',
    '2.0',
    'The purpose of each link can be determined from the link text alone.',
  ],
  [
    '2.4.10',
    'Section Headings',
    'AAA',
    'Operable',
    '2.0',
    'Section headings are used to organize content.',
  ],
  [
    '2.4.11',
    'Focus Not Obscured (Minimum)',
    'AA',
    'Operable',
    '2.2',
    'Keyboard focus indicator is not entirely hidden by author-created content.',
  ],
  [
    '2.4.12',
    'Focus Not Obscured (Enhanced)',
    'AAA',
    'Operable',
    '2.2',
    'Keyboard focus indicator is fully visible.',
  ],
  [
    '2.4.13',
    'Focus Appearance',
    'AAA',
    'Operable',
    '2.2',
    'Focus indicator meets minimum size and contrast requirements.',
  ],
  [
    '2.5.1',
    'Pointer Gestures',
    'A',
    'Operable',
    '2.1',
    'All functionality using multipoint or path-based gestures can be operated with a single pointer.',
  ],
  [
    '2.5.2',
    'Pointer Cancellation',
    'A',
    'Operable',
    '2.1',
    'Single-pointer actions can be cancelled or undone.',
  ],
  [
    '2.5.3',
    'Label in Name',
    'A',
    'Operable',
    '2.1',
    'Visible text labels are contained in the accessible name.',
  ],
  [
    '2.5.4',
    'Motion Actuation',
    'A',
    'Operable',
    '2.1',
    'Functionality that responds to motion can also be operated via UI and motion response can be disabled.',
  ],
  ['2.5.5', 'Target Size', 'AAA', 'Operable', '2.1', 'Target size is at least 44x44 CSS pixels.'],
  [
    '2.5.6',
    'Concurrent Input Mechanisms',
    'AAA',
    'Operable',
    '2.1',
    'Content does not restrict use of input modalities available on a platform.',
  ],
  [
    '2.5.7',
    'Dragging Movements',
    'AA',
    'Operable',
    '2.2',
    'All dragging functionality can be achieved with a single pointer without dragging.',
  ],
  [
    '2.5.8',
    'Target Size (Minimum)',
    'AA',
    'Operable',
    '2.2',
    'Target size is at least 24x24 CSS pixels.',
  ],
  [
    '3.1.1',
    'Language of Page',
    'A',
    'Understandable',
    '2.0',
    'The default human language of each page can be programmatically determined.',
  ],
  [
    '3.1.2',
    'Language of Parts',
    'AA',
    'Understandable',
    '2.0',
    'The language of each passage or phrase can be programmatically determined.',
  ],
  [
    '3.1.3',
    'Unusual Words',
    'AAA',
    'Understandable',
    '2.0',
    'A mechanism is available for identifying specific definitions of unusual words.',
  ],
  [
    '3.1.4',
    'Abbreviations',
    'AAA',
    'Understandable',
    '2.0',
    'A mechanism for identifying abbreviations is available.',
  ],
  [
    '3.1.5',
    'Reading Level',
    'AAA',
    'Understandable',
    '2.0',
    'Content requiring more than lower secondary education level has a simpler version available.',
  ],
  [
    '3.1.6',
    'Pronunciation',
    'AAA',
    'Understandable',
    '2.0',
    'A mechanism is available for identifying pronunciation of words.',
  ],
  [
    '3.2.1',
    'On Focus',
    'A',
    'Understandable',
    '2.0',
    'Receiving focus does not automatically change context.',
  ],
  [
    '3.2.2',
    'On Input',
    'A',
    'Understandable',
    '2.0',
    'Changing a setting does not automatically change context unless the user has been advised.',
  ],
  [
    '3.2.3',
    'Consistent Navigation',
    'AA',
    'Understandable',
    '2.0',
    'Navigation mechanisms repeat in the same order across pages.',
  ],
  [
    '3.2.4',
    'Consistent Identification',
    'AA',
    'Understandable',
    '2.0',
    'Components with the same functionality are identified consistently.',
  ],
  [
    '3.2.5',
    'Change on Request',
    'AAA',
    'Understandable',
    '2.0',
    'Changes of context are initiated only by user request.',
  ],
  [
    '3.2.6',
    'Consistent Help',
    'A',
    'Understandable',
    '2.2',
    'Help mechanisms appear in the same location across pages.',
  ],
  [
    '3.3.1',
    'Error Identification',
    'A',
    'Understandable',
    '2.0',
    'Input errors are identified and described to the user in text.',
  ],
  [
    '3.3.2',
    'Labels or Instructions',
    'A',
    'Understandable',
    '2.0',
    'Labels or instructions are provided when content requires user input.',
  ],
  [
    '3.3.3',
    'Error Suggestion',
    'AA',
    'Understandable',
    '2.0',
    'Error correction suggestions are provided when an input error is detected.',
  ],
  [
    '3.3.4',
    'Error Prevention (Legal, Financial, Data)',
    'AA',
    'Understandable',
    '2.0',
    'Submissions can be reviewed, confirmed, or reversed.',
  ],
  ['3.3.5', 'Help', 'AAA', 'Understandable', '2.0', 'Context-sensitive help is available.'],
  [
    '3.3.6',
    'Error Prevention (All)',
    'AAA',
    'Understandable',
    '2.0',
    'All submissions can be checked, confirmed, or reversed.',
  ],
  [
    '3.3.7',
    'Redundant Entry',
    'A',
    'Understandable',
    '2.2',
    'Information previously entered is auto-populated or available for selection.',
  ],
  [
    '3.3.8',
    'Accessible Authentication (Minimum)',
    'AA',
    'Understandable',
    '2.2',
    'Cognitive function tests are not required for authentication unless an alternative is provided.',
  ],
  [
    '3.3.9',
    'Accessible Authentication (Enhanced)',
    'AAA',
    'Understandable',
    '2.2',
    'Cognitive function tests are not required for authentication.',
  ],
  [
    '4.1.1',
    'Parsing',
    'A',
    'Robust',
    '2.0',
    'Content implemented in markup languages has complete start/end tags and no duplicate attributes.',
  ],
  [
    '4.1.2',
    'Name, Role, Value',
    'A',
    'Robust',
    '2.0',
    'UI components have accessible names, roles, states, and values.',
  ],
  [
    '4.1.3',
    'Status Messages',
    'AA',
    'Robust',
    '2.1',
    'Status messages can be programmatically determined so they can be presented without receiving focus.',
  ],
];

const PRODUCT_TYPES = '["web","software-desktop","software-mobile","documents"]';
const PRODUCT_TYPES_EXTENDED =
  '["web","software-desktop","software-mobile","documents","hardware","telephony"]';

type NonWcagCriterionRow = [code: string, name: string, description: string];

const S508_CHAPTER3: NonWcagCriterionRow[] = [
  ['302.1', 'Without Vision', 'At least one mode of operation that does not require user vision.'],
  ['302.2', 'With Limited Vision', 'At least one mode of operation for users with limited vision.'],
  [
    '302.3',
    'Without Perception of Color',
    'At least one mode that does not require color perception.',
  ],
  ['302.4', 'Without Hearing', 'At least one mode that does not require hearing.'],
  [
    '302.5',
    'With Limited Hearing',
    'At least one mode of operation for users with limited hearing.',
  ],
  ['302.6', 'Without Speech', 'At least one mode that does not require user speech.'],
  [
    '302.7',
    'With Limited Manipulation',
    'At least one mode that does not require fine motor control.',
  ],
  [
    '302.8',
    'With Limited Reach and Strength',
    'At least one mode usable by people with limited reach or strength.',
  ],
  [
    '302.9',
    'With Limited Language, Cognitive, and Learning Abilities',
    'At least one mode for users with limited language or cognitive abilities.',
  ],
];

const S508_CHAPTER5: NonWcagCriterionRow[] = [
  [
    '502.2.1',
    'User Control of Accessibility Features',
    'Software that is assistive technology shall support the accessibility services of the platform.',
  ],
  [
    '502.2.2',
    'No Disruption of Accessibility Features',
    'Software shall not disrupt platform features defined in platform documentation as accessibility features.',
  ],
  [
    '502.3.1',
    'Object Information',
    'The object role, state(s), boundary, name, and description shall be programmatically determinable.',
  ],
  [
    '502.3.2',
    'Modification of Object Information',
    'States and properties that can be set by the user shall be capable of being set programmatically.',
  ],
  [
    '502.3.3',
    'Row, Column, and Headers',
    'If an object is in a data table, the occupied rows and columns shall be programmatically determinable.',
  ],
];

const S508_CHAPTER6: NonWcagCriterionRow[] = [
  [
    '602.2',
    'Accessibility and Compatibility Features',
    'Documentation describes product accessibility and AT compatibility features.',
  ],
  [
    '602.3',
    'Electronic Support Documentation',
    'All support documentation meets WCAG 2.0 Level A and AA.',
  ],
  [
    '602.4',
    'Alternate Formats',
    'Documentation is available in alternate accessible formats on request.',
  ],
  ['603.2', 'Information Services', 'Support staff are trained to assist users with disabilities.'],
];

const EN_CLAUSE4: NonWcagCriterionRow[] = [
  [
    '4.2.1',
    'Usage without vision',
    'Where ICT provides visual modes of operation, some modes do not require vision.',
  ],
  [
    '4.2.2',
    'Usage with limited vision',
    'Where ICT provides visual modes, some modes enable users with limited vision.',
  ],
  [
    '4.2.3',
    'Usage without perception of colour',
    'Where ICT provides visual modes, some modes do not require colour perception.',
  ],
  [
    '4.2.4',
    'Usage without hearing',
    'Where ICT provides auditory modes, some modes do not require hearing.',
  ],
  [
    '4.2.5',
    'Usage with limited hearing',
    'Where ICT provides auditory modes, some modes support users with limited hearing.',
  ],
  [
    '4.2.6',
    'Usage without vocal capability',
    'Where ICT requires voice input, an alternative mode is provided.',
  ],
  [
    '4.2.7',
    'Usage with limited manipulation or strength',
    'Where ICT requires manual actions, some modes do not require fine motor control.',
  ],
  [
    '4.2.8',
    'Usage with limited reach',
    'Where ICT products are free-standing, they can be operated by people with limited reach.',
  ],
  [
    '4.2.9',
    'Minimize photosensitive seizure triggers',
    'ICT minimizes the potential to trigger photosensitive seizures.',
  ],
  ['4.2.10', 'Usage without timed responses', 'ICT does not require timed responses.'],
];

const EN_CLAUSE5: NonWcagCriterionRow[] = [
  [
    '5.2',
    'Activation of accessibility features',
    'Accessibility features can be activated without requiring AT.',
  ],
  [
    '5.3',
    'Biometrics',
    'Where biometrics are required for identity, an alternative non-biometric method is provided.',
  ],
  [
    '5.4',
    'Preservation of accessibility information during conversion',
    'Format conversions preserve accessibility information.',
  ],
  ['5.7', 'Key repeat', 'Keyboard repeat delay and speed can be adjusted.'],
  [
    '5.8',
    'Double-strike key acceptance',
    'Keyboard double-strike acceptance time can be adjusted.',
  ],
  [
    '5.9',
    'Simultaneous user actions',
    'ICT does not require simultaneous user actions for operation.',
  ],
];

const EN_CLAUSE12: NonWcagCriterionRow[] = [
  [
    '12.1.1',
    'Accessibility and compatibility features',
    'Product documentation lists its accessibility features.',
  ],
  ['12.1.2', 'Accessible documentation', 'All product documentation meets WCAG 2.1 Level AA.'],
  [
    '12.2.2',
    'Information on accessibility and compatibility features',
    'Support services provide information about accessibility features.',
  ],
  [
    '12.2.3',
    'Effective communication',
    'Support services communicate effectively with users with disabilities.',
  ],
  [
    '12.2.4',
    'Accessible documentation',
    'Documentation provided by support services meets WCAG 2.1 AA.',
  ],
];

export function seedCriteria(): void {
  const db = getDb();

  // Seed WCAG criteria
  const existingWcag = (
    db.prepare("SELECT COUNT(*) as n FROM criteria WHERE standard = 'WCAG'").get() as { n: number }
  ).n;

  if (existingWcag === 0) {
    const insertWcag = db.prepare(`
      INSERT INTO criteria (id, code, name, description, standard, chapter_section, wcag_version, level, editions, product_types, sort_order)
      VALUES (?, ?, ?, ?, 'WCAG', ?, ?, ?, ?, ?, ?)
    `);

    const insertAllWcag = db.transaction(() => {
      WCAG_CRITERIA.forEach(
        ([code, name, level, chapter_section, wcag_version, description], index) => {
          const editions = getEditions(wcag_version);
          insertWcag.run(
            `wcag-${code}`,
            code,
            name,
            description,
            chapter_section,
            wcag_version,
            level,
            JSON.stringify(editions),
            PRODUCT_TYPES,
            index + 1
          );
        }
      );
    });

    insertAllWcag();
  }

  // Seed Section 508 criteria
  const existing508 = (
    db.prepare("SELECT COUNT(*) as n FROM criteria WHERE standard = '508'").get() as { n: number }
  ).n;

  if (existing508 === 0) {
    const insert508 = db.prepare(`
      INSERT INTO criteria (id, code, name, description, standard, chapter_section, wcag_version, level, editions, product_types, sort_order)
      VALUES (?, ?, ?, ?, '508', ?, NULL, NULL, ?, ?, ?)
    `);

    const editions508 = JSON.stringify(['508', 'INT']);

    const insertAll508 = db.transaction(() => {
      S508_CHAPTER3.forEach(([code, name, description], index) => {
        insert508.run(
          `508-${code}`,
          code,
          name,
          description,
          'Chapter3',
          editions508,
          PRODUCT_TYPES_EXTENDED,
          index + 1
        );
      });
      S508_CHAPTER6.forEach(([code, name, description], index) => {
        insert508.run(
          `508-${code}`,
          code,
          name,
          description,
          'Chapter6',
          editions508,
          PRODUCT_TYPES,
          S508_CHAPTER3.length + index + 1
        );
      });
    });

    insertAll508();
  }

  // Seed Section 508 Chapter 5 criteria (software-specific, separate guard for idempotency)
  const existingCh5 = (
    db
      .prepare(
        "SELECT COUNT(*) as n FROM criteria WHERE standard = '508' AND chapter_section = 'Chapter5'"
      )
      .get() as { n: number }
  ).n;

  if (existingCh5 === 0) {
    const insert508Ch5 = db.prepare(`
      INSERT INTO criteria (id, code, name, description, standard, chapter_section, wcag_version, level, editions, product_types, sort_order)
      VALUES (?, ?, ?, ?, '508', 'Chapter5', NULL, NULL, ?, ?, ?)
    `);

    const editions508 = JSON.stringify(['508', 'INT']);
    // Software-only product types — NOT web (key for autoNotApplicable)
    const softwareOnlyTypes = '["software-desktop","software-mobile"]';

    const insertAllCh5 = db.transaction(() => {
      S508_CHAPTER5.forEach(([code, name, description], index) => {
        insert508Ch5.run(
          `508-${code}`,
          code,
          name,
          description,
          editions508,
          softwareOnlyTypes,
          S508_CHAPTER3.length + S508_CHAPTER6.length + index + 1
        );
      });
    });

    insertAllCh5();
  }

  // Seed EN 301 549 criteria
  const existingEn = (
    db.prepare("SELECT COUNT(*) as n FROM criteria WHERE standard = 'EN301549'").get() as {
      n: number;
    }
  ).n;

  if (existingEn === 0) {
    const insertEn = db.prepare(`
      INSERT INTO criteria (id, code, name, description, standard, chapter_section, wcag_version, level, editions, product_types, sort_order)
      VALUES (?, ?, ?, ?, 'EN301549', ?, NULL, NULL, ?, ?, ?)
    `);

    const editionsEn = JSON.stringify(['EU', 'INT']);

    const insertAllEn = db.transaction(() => {
      EN_CLAUSE4.forEach(([code, name, description], index) => {
        insertEn.run(
          `en-${code}`,
          code,
          name,
          description,
          'Clause4',
          editionsEn,
          PRODUCT_TYPES_EXTENDED,
          index + 1
        );
      });
      EN_CLAUSE5.forEach(([code, name, description], index) => {
        insertEn.run(
          `en-${code}`,
          code,
          name,
          description,
          'Clause5',
          editionsEn,
          PRODUCT_TYPES,
          EN_CLAUSE4.length + index + 1
        );
      });
      EN_CLAUSE12.forEach(([code, name, description], index) => {
        insertEn.run(
          `en-${code}`,
          code,
          name,
          description,
          'Clause12',
          editionsEn,
          PRODUCT_TYPES,
          EN_CLAUSE4.length + EN_CLAUSE5.length + index + 1
        );
      });
    });

    insertAllEn();
  }
}
