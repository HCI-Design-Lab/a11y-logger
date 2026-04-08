import { getDb } from './index';

// NOTE: This file uses getDb() (better-sqlite3) rather than getDbClient() (Drizzle)
// because seedCriteria() is called inside initDb() before the Drizzle client is
// initialized. Criteria are read-only seed data; the criteria.ts data access file
// uses Drizzle for all runtime queries.

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

const PRODUCT_TYPES_HARDWARE = '["hardware"]';
const PRODUCT_TYPES_VOICE = '["hardware","software-desktop","software-mobile"]';
const PRODUCT_TYPES_VIDEO = '["hardware","software-desktop","software-mobile","web"]';
const PRODUCT_TYPES_DOCUMENTS = '["documents"]';
const PRODUCT_TYPES_SOFTWARE = '["software-desktop","software-mobile"]';
const PRODUCT_TYPES_RELAY = '["hardware","software-desktop","software-mobile","web"]';

const S508_CHAPTER4: NonWcagCriterionRow[] = [
  [
    '402.1',
    'General (Closed Functionality)',
    'ICT with closed functionality shall be accessible to users with disabilities without requiring the user to attach or install assistive technology.',
  ],
  [
    '402.2',
    'Speech-Output Enabled by Default',
    'ICT with a display screen shall provide speech output as a default function that is enabled by factory default.',
  ],
  [
    '402.3',
    'Volume',
    'ICT that delivers audio output shall provide volume control and output amplification.',
  ],
  [
    '402.4',
    'Characters on Display Screens',
    'At least one mode of characters on display screens shall be in a sans serif font.',
  ],
  [
    '403.1',
    'General (Biometrics)',
    'Biometrics shall not be the only means for user identification or control.',
  ],
  [
    '404.1',
    'General (Preservation of Information)',
    'ICT that transmits or converts information shall not lose or alter accessibility information needed to comply with Section 508.',
  ],
  [
    '405.1',
    'General (Privacy)',
    'The same degree of privacy of input and output shall be provided to users with disabilities as provided to others.',
  ],
  [
    '406.1',
    'General (Standard Connections)',
    'Where data connections used for input and output are provided, at least one of each type shall conform to industry-standard non-proprietary formats.',
  ],
  [
    '407.2',
    'Operable Parts',
    'ICT shall comply with applicable requirements in ANSI/HFES 200.2 for hardware products.',
  ],
  [
    '407.3',
    'Numeric Keys',
    'Where provided, numeric keys shall be arranged in a 12-key ascending or descending keypad layout. The number five key shall be tactilely distinct from the other keys.',
  ],
  [
    '407.4',
    'Key Repeat',
    'Where a keyboard or keypad is provided, the delay before key repeat shall be adjustable to at least 2 seconds. Key repeat rate shall be adjustable to 2 seconds per character.',
  ],
  [
    '407.5',
    'Timed Response',
    'Where a timed response is required, the user shall be alerted visually, as well as by touch or sound, and given the opportunity to indicate more time is needed.',
  ],
  [
    '407.6',
    'Operation',
    'At least one mode of operation shall not require fine motor control or simultaneous actions and shall be operable with one hand.',
  ],
  [
    '407.7',
    'Tickets, Fare Cards, and Keycards',
    'Where tickets, fare cards, or keycards are used, they shall have an orientation that is tactilely discernible.',
  ],
  [
    '407.8',
    'Reach and Manipulation',
    'ICT shall comply with the reach ranges and manipulation requirements of ANSI/HFES 200.2.',
  ],
  [
    '408.2',
    'Visibility (Display Screens)',
    'Where stationary ICT provides one or more display screens, at least one display screen shall be visible from a point located 40 inches above the floor space where the ICT is accessed.',
  ],
  [
    '408.3',
    'Flicker Rate',
    'Displays shall have a flicker rate of at least 70 Hz, or shall have a non-interlaced display.',
  ],
  [
    '409.1',
    'General (Status Indicators)',
    'Where provided, status indicators shall be discernible visually and by touch or sound.',
  ],
  [
    '410.1',
    'General (Color Coding)',
    'ICT shall not use color as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element.',
  ],
  ['411.1', 'General (Flashing)', 'ICT shall not display flashing content between 2 Hz and 55 Hz.'],
  [
    '412.2.1',
    'Volume Gain (Fixed-Line)',
    'ICT that provides two-way voice communication and uses a handset shall provide a gain adjustable up to a minimum of 20 dB above the nominal earphone output level.',
  ],
  [
    '412.2.2',
    'Volume Gain (Portable)',
    'Portable ICT that provides two-way voice communication and uses an integral speaker shall provide automatic gain control.',
  ],
  [
    '412.3.1',
    'Wireless Hearing Technologies',
    'ICT that provides two-way voice communication and is wireless shall provide a wireless mode of operation compatible with hearing technologies.',
  ],
  [
    '412.3.2',
    'Corded Hearing Technologies',
    'ICT that provides two-way voice communication and uses a corded handset shall provide a connection compatible with hearing technologies using a standard 3.5 mm connector.',
  ],
  [
    '412.4',
    'Digital Encoding of Speech',
    'ICT in IP-based networks shall not use audio codecs that reduce speech intelligibility below the level required to be compliant with ITU-T Recommendation G.722.',
  ],
  [
    '412.5',
    'Real-Time Text Functionality',
    'Where ICT provides real-time voice communication, it shall provide real-time text functionality that meets the requirements of ATIS-0700002.',
  ],
  [
    '412.6',
    'Caller ID',
    'Where provided, caller identification and similar telecommunications functions shall be accessible to users who are deaf or hard of hearing.',
  ],
  [
    '412.7',
    'Video Communication',
    'Where ICT provides real-time video functionality, the quality of the video shall be sufficient to support communication using sign language.',
  ],
  [
    '412.8.1',
    'TTY Connectability',
    'ICT shall include a standard non-acoustic connection point for TTYs.',
  ],
  [
    '412.8.2',
    'Voice and Hearing Carry Over',
    'ICT shall provide a microphone that can be turned on and off by the user to allow the user to intermix speech with TTY use.',
  ],
  [
    '412.8.3',
    'Signal Compatibility',
    'ICT shall support all TTY signal formats that can be used with the Public Switched Telephone Network.',
  ],
  [
    '412.8.4',
    'Voice Mail and Messaging Systems',
    'Voice mail, auto-attendant, interactive voice response, and similar telephone functions shall be usable with a TTY.',
  ],
  [
    '413.1.1',
    'Caption Processing Technologies',
    'ICT that displays or processes video with synchronized audio shall provide a mechanism to select and play captions provided for the audio.',
  ],
  [
    '413.1.2',
    'Additional Caption Processing Technologies',
    'ICT that displays or processes video with synchronized audio shall provide a mechanism to allow the user to select a caption presentation.',
  ],
  [
    '414.1.1',
    'Audio Description Processing Technologies',
    'ICT that displays or processes video with synchronized audio shall provide a mechanism to select and play audio description provided for the video.',
  ],
  [
    '414.1.2',
    'Additional Audio Description Processing Technologies',
    'ICT that displays or processes video with synchronized audio shall provide a mechanism to allow the user to select audio description.',
  ],
  [
    '415.1.1',
    'User Controls for Captions',
    'Where ICT displays video with synchronized audio, ICT shall provide user controls for captions at the same menu level as the user controls for volume or program selection.',
  ],
  [
    '415.1.2',
    'User Controls for Audio Descriptions',
    'Where ICT displays video with synchronized audio, ICT shall provide user controls for audio descriptions at the same menu level as the user controls for volume or program selection.',
  ],
];

const EN_CLAUSE6: NonWcagCriterionRow[] = [
  [
    '6.1',
    'Audio bandwidth for speech',
    'Where ICT provides two-way voice communication, it shall support the use of audio bandwidth with an upper frequency limit of at least 7 000 Hz.',
  ],
  [
    '6.2.1.1',
    'RTT communication',
    'Where ICT provides two-way voice communication, it shall provide real-time text (RTT) functionality.',
  ],
  [
    '6.2.1.2',
    'Concurrent voice and text',
    'RTT shall work concurrently with voice where both modes are supported.',
  ],
  [
    '6.2.2.1',
    'Visually distinguishable display',
    'Where ICT provides two-way voice communication and includes RTT, the RTT shall be visually distinguishable from the voice audio portion.',
  ],
  [
    '6.2.2.2',
    'Programmatically determinable send and receive direction',
    'Where ICT provides RTT communication, it shall be possible to programmatically determine the direction of sent and received text.',
  ],
  [
    '6.2.3',
    'Interoperability',
    'Where ICT provides RTT, the RTT shall interoperate with the ITU-T T.140 standard.',
  ],
  [
    '6.2.4',
    'Real-time text responsiveness',
    'Where RTT is provided, the text entered shall be transmitted to the far end within 500 ms of the key press.',
  ],
  [
    '6.3',
    'Caller ID',
    'Where caller identification is provided, the caller identification shall be available in text form and shall be conveyed to the user via visual output.',
  ],
  [
    '6.4',
    'Alternatives to voice-based services',
    'Where ICT provides real-time voice communication and voicemail, auto-attendant, or interactive voice response facilities, the ICT shall offer users a means to access the information without the use of hearing or speech.',
  ],
  [
    '6.5.1',
    'General (Video communication)',
    'Where ICT provides two-way voice communication and includes real-time video functionality, it shall support at least one mode of operation where the quality of the video is sufficient to support communication using sign language.',
  ],
  [
    '6.5.2',
    'Resolution',
    'Where video communication functionality is provided, the video resolution shall be at least QVGA (320 × 240) resolution.',
  ],
  [
    '6.5.3',
    'Frame rate',
    'Where video communication functionality is provided, the video frame rate shall be at least 12 frames per second (fps).',
  ],
  [
    '6.5.4',
    'Synchronization between audio and video',
    'Where ICT provides real-time video and audio, the time difference between the audio and the video shall not exceed 100 ms.',
  ],
];

const EN_CLAUSE7: NonWcagCriterionRow[] = [
  [
    '7.1.1',
    'Captioning playback',
    'Where ICT displays video with synchronized audio, it shall provide a mode of operation to display the available closed captions.',
  ],
  [
    '7.1.2',
    'Captioning synchronization',
    'Where ICT displays closed captions, the mechanism to display captions shall preserve the synchronization between the audio and the captions as provided.',
  ],
  [
    '7.1.3',
    'Preservation of captioning',
    'Where ICT transmits, converts, or records video with synchronized audio, it shall preserve caption data such that it can be displayed.',
  ],
  [
    '7.1.4',
    'Captions characteristics',
    'Where ICT displays captions, it shall allow the user to adapt the display of the captions to individual requirements.',
  ],
  [
    '7.1.5',
    'Spoken subtitles',
    'Where ICT displays video with synchronized audio, it shall provide a spoken output for the available captions.',
  ],
  [
    '7.2.1',
    'Audio description playback',
    'Where ICT displays video with synchronized audio, it shall provide a mode of operation to play the available audio description.',
  ],
  [
    '7.2.2',
    'Audio description synchronization',
    'Where ICT plays audio description, it shall preserve the synchronization between the audio/video content and the corresponding audio description.',
  ],
  [
    '7.2.3',
    'Preservation of audio description',
    'Where ICT transmits, converts, or records video with synchronized audio, it shall preserve audio description data.',
  ],
  [
    '7.3',
    'User controls for captions and audio description',
    'Where ICT displays primarily video and audio content, user controls for captions and audio description shall be provided to the user at the same level of interaction as the primary media controls.',
  ],
];

const EN_CLAUSE8: NonWcagCriterionRow[] = [
  [
    '8.1.1',
    'Generic requirements (Hardware)',
    'ICT shall satisfy the applicable hardware requirements in this clause.',
  ],
  [
    '8.1.2',
    'Standard connections',
    'Where ICT has a data connection, it shall have at least one standard non-proprietary connection point.',
  ],
  [
    '8.1.3',
    'Colour',
    'ICT shall not use colour as the only visual means of conveying information.',
  ],
  [
    '8.2.1.1',
    'Speech volume range',
    'Where ICT provides speech output, it shall provide a volume range of at least 18 dB.',
  ],
  [
    '8.2.1.2',
    'Incremental volume control',
    'Where ICT provides speech output, volume control shall be provided with at least one intermediate step of 12 dB gain.',
  ],
  [
    '8.2.2.1',
    'Fixed-line devices',
    'Corded handset telephone devices shall provide a means for inductive coupling that comply with current TIA-1083-B standard.',
  ],
  [
    '8.2.2.2',
    'Wireless communication devices',
    'ICT with a wireless device shall provide wireless coupling to hearing technologies.',
  ],
  [
    '8.3.2.1',
    'Forward reach',
    'Where the operating area is approached from the front, the reach to operable parts shall not exceed 1 220 mm.',
  ],
  [
    '8.3.2.2',
    'Side reach',
    'Where the operating area is approached from the side, the reach to operable parts shall not exceed 1 220 mm.',
  ],
  [
    '8.3.3.1',
    'Unobstructed forward reach',
    'Where an unobstructed forward approach is provided, operable parts shall not be higher than 1 220 mm or lower than 380 mm.',
  ],
  [
    '8.3.3.2',
    'Obstructed forward reach',
    'Where a forward approach is provided and the depth of the obstruction is greater than 510 mm, the height of the operable parts shall not exceed 1 120 mm.',
  ],
  [
    '8.3.4.1',
    'Unobstructed side reach',
    'Where an unobstructed side approach is provided, operable parts shall not be higher than 1 220 mm or lower than 380 mm.',
  ],
  [
    '8.3.5',
    'Visibility',
    'Where a stationary ICT product provides a visual display, the display shall be visible from a point located 1 000 mm above the centre of the floor of the product.',
  ],
  [
    '8.4.1',
    'Numeric keys',
    'Where provided, the number five key shall be tactilely distinct from the other keys of the numeric keypad.',
  ],
  [
    '8.4.2',
    'Operation of mechanical parts',
    'All mechanical parts shall be operable without tight grasping, pinching, or twisting of the wrist.',
  ],
  [
    '8.4.3',
    'Keys, tickets, fare cards',
    'Where keys, tickets, or fare cards are used, they shall have a tactilely discernible orientation.',
  ],
  [
    '8.5',
    'Tactile indication of speech mode',
    'ICT that permits voice communication shall provide at least one mode of operation that uses a tactile discernible indicator to determine the status of the voice communication.',
  ],
];

const EN_CLAUSE10: NonWcagCriterionRow[] = [
  [
    '10.1.1.1',
    'Non-text content (documents)',
    'All non-text content in documents has a text alternative that serves the equivalent purpose.',
  ],
  [
    '10.1.3.1',
    'Info and relationships (documents)',
    'Information and relationships in documents conveyed through presentation can be programmatically determined.',
  ],
  [
    '10.1.3.2',
    'Meaningful sequence (documents)',
    'The reading sequence of documents can be programmatically determined.',
  ],
  [
    '10.1.3.3',
    'Sensory characteristics (documents)',
    'Instructions in documents do not rely solely on sensory characteristics such as shape, colour, size, visual location, or sound.',
  ],
  [
    '10.1.3.4',
    'Orientation (documents)',
    'Document content is not restricted to a single display orientation.',
  ],
  [
    '10.1.3.5',
    'Identify input purpose (documents)',
    'The purpose of each input field in documents can be programmatically determined.',
  ],
  [
    '10.1.4.1',
    'Use of colour (documents)',
    'Colour is not used as the only visual means of conveying information in documents.',
  ],
  [
    '10.1.4.2',
    'Audio control (documents)',
    'Where documents contain audio that plays automatically, a mechanism is available to pause, stop, or control volume.',
  ],
  [
    '10.1.4.3',
    'Contrast minimum (documents)',
    'Text in documents has a contrast ratio of at least 4.5:1.',
  ],
  [
    '10.1.4.4',
    'Resize text (documents)',
    'Text in documents can be resized up to 200 percent without loss of content or functionality.',
  ],
  [
    '10.1.4.5',
    'Images of text (documents)',
    'Documents use text rather than images of text to convey information where possible.',
  ],
  [
    '10.2.1.1',
    'Keyboard (documents)',
    'All document functionality is operable through a keyboard interface.',
  ],
  [
    '10.2.1.2',
    'No keyboard trap (documents)',
    'Keyboard focus can be moved away from any component in documents using standard key strokes.',
  ],
  ['10.2.4.2', 'Document titled', 'Documents have titles that describe the topic or purpose.'],
  [
    '10.2.4.3',
    'Focus order (documents)',
    'The document focus order preserves meaning and operability.',
  ],
  [
    '10.2.4.4',
    'Link purpose (documents)',
    'The purpose of each link in a document can be determined from the link text or context.',
  ],
  [
    '10.3.1.1',
    'Language of document',
    'The default human language of each document can be programmatically determined.',
  ],
  [
    '10.3.2.1',
    'On focus (documents)',
    'Receiving focus in documents does not automatically change context.',
  ],
  [
    '10.3.3.1',
    'Error identification (documents)',
    'Input errors in documents are identified and described in text.',
  ],
  ['10.4.1.1', 'Parsing (documents)', 'Documents do not contain significant markup errors.'],
  [
    '10.4.1.2',
    'Name, role, value (documents)',
    'Components in documents have accessible name, role, and any state, property, and value.',
  ],
  [
    '10.5',
    'Caption positioning',
    'Where captions are provided in documents, they shall not obscure relevant information in the document.',
  ],
  [
    '10.6',
    'Audio description timing',
    'Where audio description is provided in documents, the ICT shall not prevent the audio description from being rendered.',
  ],
];

const EN_CLAUSE11: NonWcagCriterionRow[] = [
  [
    '11.1.1.1.1',
    'Non-text content (software, no AT exception)',
    'All non-text content in software UIs has a text alternative.',
  ],
  [
    '11.1.1.1.2',
    'Non-text content (software, AT exception)',
    'Where software uses platform accessibility services, non-text content has a text alternative accessible via those services.',
  ],
  [
    '11.1.2.1.1',
    'Audio-only and video-only (software)',
    'Prerecorded audio-only and video-only content in software has an alternative.',
  ],
  [
    '11.1.3.1.1',
    'Info and relationships (software, no AT exception)',
    'Information and relationships in software UIs can be programmatically determined.',
  ],
  [
    '11.1.3.3',
    'Sensory characteristics (software)',
    'Instructions in software do not rely solely on sensory characteristics.',
  ],
  [
    '11.1.3.4',
    'Orientation (software)',
    'Software does not restrict content to a single display orientation.',
  ],
  [
    '11.1.3.5.1',
    'Identify input purpose (software)',
    'The purpose of each input field in software can be programmatically determined.',
  ],
  [
    '11.1.4.1',
    'Use of colour (software)',
    'Colour is not used as the only visual means of conveying information in software.',
  ],
  [
    '11.1.4.2',
    'Audio control (software)',
    'Software provides a mechanism to pause, stop, or control the volume of audio.',
  ],
  [
    '11.1.4.3',
    'Contrast minimum (software)',
    'Text in software has a contrast ratio of at least 4.5:1.',
  ],
  [
    '11.1.4.4.1',
    'Resize text (software)',
    'Software text can be resized up to 200 percent without loss of content or functionality.',
  ],
  [
    '11.1.4.5.1',
    'Images of text (software)',
    'Software uses text rather than images of text to convey information.',
  ],
  [
    '11.2.1.1.1',
    'Keyboard (software, no AT exception)',
    'All software functionality is operable through a keyboard interface.',
  ],
  [
    '11.2.1.1.2',
    'Keyboard (software, AT keyboard)',
    'Software that uses platform accessibility services is operable by keyboard.',
  ],
  [
    '11.2.1.2',
    'No keyboard trap (software)',
    'Keyboard focus can be moved away from any software component.',
  ],
  ['11.2.4.3', 'Focus order (software)', 'Software focus order preserves meaning and operability.'],
  [
    '11.2.4.4',
    'Link purpose (software)',
    'Link purpose in software can be determined from the link text or context.',
  ],
  ['11.2.4.7', 'Focus visible (software)', 'Keyboard focus indicator is visible in software.'],
  [
    '11.3.1.1.1',
    'Language of software',
    'The default human language of software can be programmatically determined.',
  ],
  [
    '11.3.2.1',
    'On focus (software)',
    'Receiving focus in software does not automatically change context.',
  ],
  [
    '11.3.2.2',
    'On input (software)',
    'Changing a setting in software does not automatically change context.',
  ],
  [
    '11.3.3.1.1',
    'Error identification (software)',
    'Input errors in software are identified and described in text.',
  ],
  [
    '11.3.3.2',
    'Labels or instructions (software)',
    'Labels or instructions are provided when software requires user input.',
  ],
  [
    '11.3.3.3',
    'Error suggestion (software)',
    'Software provides suggestions for correcting input errors when the purpose can be determined.',
  ],
  [
    '11.4.1.1.1',
    'Parsing (software, no AT exception)',
    'Software does not contain significant errors in its user interface implementation.',
  ],
  [
    '11.4.1.1.2',
    'Parsing (software, AT exception)',
    'Where software uses platform accessibility services, it is parseable by those services.',
  ],
  [
    '11.4.1.2.1',
    'Name, role, value (software, no AT exception)',
    'Components in software have accessible name, role, and any state, property, and value.',
  ],
  [
    '11.4.1.2.2',
    'Name, role, value (software, AT exception)',
    'Software using platform accessibility services exposes name, role, state, property, and value via those services.',
  ],
  [
    '11.4.1.3.1',
    'Status messages (software, no AT exception)',
    'Status messages in software can be programmatically determined.',
  ],
  [
    '11.4.1.3.2',
    'Status messages (software, AT exception)',
    'Status messages using platform accessibility services can be programmatically determined.',
  ],
  [
    '11.5.1',
    'Closed functionality (software)',
    'Where software has closed functionality, it shall meet all applicable requirements without the user needing to install AT.',
  ],
  [
    '11.5.2.1',
    'Platform accessibility service',
    'Software shall use platform accessibility services.',
  ],
  [
    '11.5.2.2',
    'Accessibility services for AT',
    'Software providing a user interface shall use the documented platform accessibility services.',
  ],
  [
    '11.5.2.5',
    'Object information',
    'Software shall expose the role of each user interface element via the platform accessibility service.',
  ],
  [
    '11.5.2.6',
    'Row, column, and headers',
    'Software shall expose row and column information and any headers via the platform accessibility service.',
  ],
  [
    '11.5.2.7',
    'Values',
    'Software shall expose the current value and any allowed range of values for user interface controls.',
  ],
  [
    '11.5.2.8',
    'Label relationships',
    'Software shall expose the relationship between labels and their associated controls.',
  ],
  [
    '11.5.2.9',
    'Parent-child relationships',
    'Software shall expose the parent-child relationships in the user interface hierarchy.',
  ],
  [
    '11.5.2.10',
    'Text',
    'Software shall expose the text content of user interface elements via the platform accessibility service.',
  ],
  [
    '11.5.2.11',
    'List of available actions',
    'Software shall expose the list of actions that can be executed on a user interface element.',
  ],
  [
    '11.5.2.12',
    'Execution of available actions',
    'Software shall allow AT to execute the actions exposed for a user interface element.',
  ],
  [
    '11.5.2.13',
    'Tracking of focus and selection attributes',
    'Software shall expose the current keyboard focus and selection state of user interface elements.',
  ],
  [
    '11.5.2.14',
    'Modification of focus and selection attributes',
    'Software shall allow AT to modify the current keyboard focus and selection state.',
  ],
  [
    '11.5.2.15',
    'Change notification',
    'Software shall notify the platform accessibility service of changes to user interface elements.',
  ],
  [
    '11.5.2.16',
    'Modifications of states and properties',
    'Software shall allow AT to modify states and properties of user interface elements where permitted by the user agent.',
  ],
  [
    '11.5.2.17',
    'Modifications of values and text',
    'Software shall allow AT to modify values and text of user interface elements where the user can do so through the standard interface.',
  ],
  [
    '11.6.1',
    'User control of accessibility features (authoring)',
    'Authoring tools shall not disable platform accessibility features.',
  ],
  [
    '11.6.2',
    'No disruption of accessibility features',
    'Software shall not disrupt platform accessibility features during operation.',
  ],
  [
    '11.7',
    'User preferences',
    'Software shall not override user-selected contrast and colour selections and other individual display attributes.',
  ],
  [
    '11.8.1',
    'Content technology (authoring tools)',
    'Authoring tools shall use a content technology that supports the creation of accessible content.',
  ],
  [
    '11.8.2',
    'Accessible content creation',
    'Authoring tools shall enable and guide users to create content that conforms to WCAG 2.1 Level AA.',
  ],
  [
    '11.8.3',
    'Preservation of accessibility in transformations',
    'If an authoring tool converts content, accessibility information shall be preserved.',
  ],
  [
    '11.8.4',
    'Repair assistance',
    'Where the ICT is an authoring tool and can detect accessibility issues, it shall provide repair suggestions.',
  ],
  [
    '11.8.5',
    'Templates',
    'Where an authoring tool provides templates, at least one template shall support creation of content conforming to the applicable requirements.',
  ],
];

const EN_CLAUSE13: NonWcagCriterionRow[] = [
  [
    '13.1.2',
    'Text relay services',
    'Where ICT provides telephone services, it shall enable users to connect to and use text relay services.',
  ],
  [
    '13.1.3',
    'Sign relay services',
    'Where ICT provides telephone services, it shall enable users to connect to and use sign relay services.',
  ],
  [
    '13.1.4',
    'Lip-reading relay services',
    'Where ICT provides telephone services, it shall enable users to connect to and use lip-reading relay services.',
  ],
  [
    '13.1.5',
    'Captioned telephony services',
    'Where ICT provides telephone services, it shall enable users to connect to and use captioned telephony services.',
  ],
  [
    '13.1.6',
    'Video relay services',
    'Where ICT provides telephone services, it shall enable users to connect to and use video relay services.',
  ],
  [
    '13.2',
    'Access to relay services',
    'Where ICT systems interact with relay services, the technology used shall not prevent the use of those relay services.',
  ],
  [
    '13.3',
    'Access to emergency services',
    'Where ICT provides access to emergency services, it shall support text-based emergency communication.',
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

  // Seed Section 508 Chapter 4 (Hardware) criteria
  const existingCh4 = (
    db
      .prepare(
        "SELECT COUNT(*) as n FROM criteria WHERE standard = '508' AND chapter_section = 'Chapter4'"
      )
      .get() as { n: number }
  ).n;

  if (existingCh4 === 0) {
    const insert508Ch4 = db.prepare(`
      INSERT INTO criteria (id, code, name, description, standard, chapter_section, wcag_version, level, editions, product_types, sort_order)
      VALUES (?, ?, ?, ?, '508', 'Chapter4', NULL, NULL, ?, ?, ?)
    `);
    const editions508 = JSON.stringify(['508', 'INT']);
    const insertAllCh4 = db.transaction(() => {
      S508_CHAPTER4.forEach(([code, name, description], index) => {
        insert508Ch4.run(
          `508-${code}`,
          code,
          name,
          description,
          editions508,
          PRODUCT_TYPES_HARDWARE,
          index + 1
        );
      });
    });
    insertAllCh4();
  }

  // Seed EN 301 549 Clause 6 (ICT with two-way voice communication)
  const existingClause6 = (
    db
      .prepare(
        "SELECT COUNT(*) as n FROM criteria WHERE standard = 'EN301549' AND chapter_section = 'Clause6'"
      )
      .get() as { n: number }
  ).n;
  if (existingClause6 === 0) {
    const insertEn6 = db.prepare(`
      INSERT INTO criteria (id, code, name, description, standard, chapter_section, wcag_version, level, editions, product_types, sort_order)
      VALUES (?, ?, ?, ?, 'EN301549', 'Clause6', NULL, NULL, ?, ?, ?)
    `);
    const editionsEn = JSON.stringify(['EU', 'INT']);
    const insertAllEn6 = db.transaction(() => {
      EN_CLAUSE6.forEach(([code, name, description], index) => {
        insertEn6.run(
          `en-${code}`,
          code,
          name,
          description,
          editionsEn,
          PRODUCT_TYPES_VOICE,
          index + 1
        );
      });
    });
    insertAllEn6();
  }

  // Seed EN 301 549 Clause 7 (ICT with video capabilities)
  const existingClause7 = (
    db
      .prepare(
        "SELECT COUNT(*) as n FROM criteria WHERE standard = 'EN301549' AND chapter_section = 'Clause7'"
      )
      .get() as { n: number }
  ).n;
  if (existingClause7 === 0) {
    const insertEn7 = db.prepare(`
      INSERT INTO criteria (id, code, name, description, standard, chapter_section, wcag_version, level, editions, product_types, sort_order)
      VALUES (?, ?, ?, ?, 'EN301549', 'Clause7', NULL, NULL, ?, ?, ?)
    `);
    const editionsEn = JSON.stringify(['EU', 'INT']);
    const insertAllEn7 = db.transaction(() => {
      EN_CLAUSE7.forEach(([code, name, description], index) => {
        insertEn7.run(
          `en-${code}`,
          code,
          name,
          description,
          editionsEn,
          PRODUCT_TYPES_VIDEO,
          index + 1
        );
      });
    });
    insertAllEn7();
  }

  // Seed EN 301 549 Clause 8 (Hardware)
  const existingClause8 = (
    db
      .prepare(
        "SELECT COUNT(*) as n FROM criteria WHERE standard = 'EN301549' AND chapter_section = 'Clause8'"
      )
      .get() as { n: number }
  ).n;
  if (existingClause8 === 0) {
    const insertEn8 = db.prepare(`
      INSERT INTO criteria (id, code, name, description, standard, chapter_section, wcag_version, level, editions, product_types, sort_order)
      VALUES (?, ?, ?, ?, 'EN301549', 'Clause8', NULL, NULL, ?, ?, ?)
    `);
    const editionsEn = JSON.stringify(['EU', 'INT']);
    const insertAllEn8 = db.transaction(() => {
      EN_CLAUSE8.forEach(([code, name, description], index) => {
        insertEn8.run(
          `en-${code}`,
          code,
          name,
          description,
          editionsEn,
          PRODUCT_TYPES_HARDWARE,
          index + 1
        );
      });
    });
    insertAllEn8();
  }

  // Seed EN 301 549 Clause 10 (Non-web documents)
  const existingClause10 = (
    db
      .prepare(
        "SELECT COUNT(*) as n FROM criteria WHERE standard = 'EN301549' AND chapter_section = 'Clause10'"
      )
      .get() as { n: number }
  ).n;
  if (existingClause10 === 0) {
    const insertEn10 = db.prepare(`
      INSERT INTO criteria (id, code, name, description, standard, chapter_section, wcag_version, level, editions, product_types, sort_order)
      VALUES (?, ?, ?, ?, 'EN301549', 'Clause10', NULL, NULL, ?, ?, ?)
    `);
    const editionsEn = JSON.stringify(['EU', 'INT']);
    const insertAllEn10 = db.transaction(() => {
      EN_CLAUSE10.forEach(([code, name, description], index) => {
        insertEn10.run(
          `en-${code}`,
          code,
          name,
          description,
          editionsEn,
          PRODUCT_TYPES_DOCUMENTS,
          index + 1
        );
      });
    });
    insertAllEn10();
  }

  // Seed EN 301 549 Clause 11 (Software)
  const existingClause11 = (
    db
      .prepare(
        "SELECT COUNT(*) as n FROM criteria WHERE standard = 'EN301549' AND chapter_section = 'Clause11'"
      )
      .get() as { n: number }
  ).n;
  if (existingClause11 === 0) {
    const insertEn11 = db.prepare(`
      INSERT INTO criteria (id, code, name, description, standard, chapter_section, wcag_version, level, editions, product_types, sort_order)
      VALUES (?, ?, ?, ?, 'EN301549', 'Clause11', NULL, NULL, ?, ?, ?)
    `);
    const editionsEn = JSON.stringify(['EU', 'INT']);
    const insertAllEn11 = db.transaction(() => {
      EN_CLAUSE11.forEach(([code, name, description], index) => {
        insertEn11.run(
          `en-${code}`,
          code,
          name,
          description,
          editionsEn,
          PRODUCT_TYPES_SOFTWARE,
          index + 1
        );
      });
    });
    insertAllEn11();
  }

  // Seed EN 301 549 Clause 13 (ICT providing relay or emergency service access)
  const existingClause13 = (
    db
      .prepare(
        "SELECT COUNT(*) as n FROM criteria WHERE standard = 'EN301549' AND chapter_section = 'Clause13'"
      )
      .get() as { n: number }
  ).n;
  if (existingClause13 === 0) {
    const insertEn13 = db.prepare(`
      INSERT INTO criteria (id, code, name, description, standard, chapter_section, wcag_version, level, editions, product_types, sort_order)
      VALUES (?, ?, ?, ?, 'EN301549', 'Clause13', NULL, NULL, ?, ?, ?)
    `);
    const editionsEn = JSON.stringify(['EU', 'INT']);
    const insertAllEn13 = db.transaction(() => {
      EN_CLAUSE13.forEach(([code, name, description], index) => {
        insertEn13.run(
          `en-${code}`,
          code,
          name,
          description,
          editionsEn,
          PRODUCT_TYPES_RELAY,
          index + 1
        );
      });
    });
    insertAllEn13();
  }
}
