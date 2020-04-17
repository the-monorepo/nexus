import './unstyled.scss';
import * as mbx from 'name-tbd-dom';

import './globals.scss';
import styles from './styles.scss';
import text from './typography.scss';

import cx from 'classnames';

import { autorun, observable, action, computed } from 'mobx';

import 'xy-ui/components/xy-checkbox';
import 'xy-ui/components/xy-input';
import 'xy-ui/components/xy-button';

const browserFontSize = (() => {
  // TODO: Find out if there's a better way
  const tempEl = document.createElement('div');
  tempEl.style.height = '1rem';
  document.body.appendChild(tempEl);
  const size = tempEl.offsetHeight;
  document.body.removeChild(tempEl);
  return size;
})();

// Prevents slider messing with the extension UI at the expense of font resizing
document.documentElement.style.fontSize = '16px';

const Icon = ({ children }) => <span class="material-icons">{children}</span>;

const SelectAndDragIcon = () => <Icon>photo_size_select_small</Icon>;

const AppHeadingH1 = ({ children }) => <h1 class={text.h700}>{children}</h1>;

const FunctionHeadingH1 = ({ children, class: className }) => (
  <h1 class={cx(text.h600, className)}>{children}</h1>
);

const FunctionConfigSubheadngH1 = ({ children }) => (
  <h1 class={cx(text.h500, text.margin)}>{children}</h1>
);

const FieldLabel = ({ children, ...other }) => (
  <label htmlFor={name} class={cx(text.h400, text.margin, styles.fieldLabel)} {...other}>
    {children}
  </label>
);

const Field = ({ name, children, labelContent, labelClass, contentClass }) => (
  <section class={cx(styles.field, labelClass)}>
    <FieldLabel name={name}>{labelContent}</FieldLabel>
    <div class={cx(styles.fieldContent, contentClass)}>{children}</div>
  </section>
);

const CHARACTER_SLIDER_MIN = 1;
const CHARACTER_SLIDER_MAX = 400;
const CHARACTER_MIN_DEFAULT = 80;
const CHARACTER_MAX_DEFAULT = 100;
const replaceWordState = observable({
  character: {
    min: CHARACTER_MIN_DEFAULT,
    max: CHARACTER_MAX_DEFAULT,
  },
});

const fontState = observable({
  size: browserFontSize,
});

const sliderSetEmSizeFromImmediateValue = action((e) => {
  fontState.size = e.target.immediateValue;
});

const sliderSetEmSizeFromValue = action((e) => {
  fontState.size = e.target.value;
});

autorun(() => {
  chrome.fontSettings.setDefaultFontSize({
    pixelSize: fontState.size,
  });
});

const sliderSetMinMaxCharacters = action((e) => {
  replaceWordState.character.min = e.target.valueMin;
  replaceWordState.character.max = e.target.valueMax;
});

const pickWord = (letters: string) => {
  return letters[Math.trunc(Math.random() * letters.length)];
};

const previewWords = computed(() => {
  const words: string[] = [];
  for (let i = 0; i < 5; i++) {
    const letterCount =
      Math.random() * (replaceWordState.character.max - replaceWordState.character.min) +
      replaceWordState.character.min;
    const generatedWord: string[] = [];
    for (let i = 0; i < letterCount; i++) {
      generatedWord[i] = pickWord('abcdefghijklmnopqrstuvwxyz');
    }
    words[i] = generatedWord.join('');
  }
  return words;
});

const languageState = observable({
  langs: [...window.navigator.languages],
});

autorun(() => {});

const addLangPreference = {
  handle: action((e) => {
    try {
      const newLang = Intl.getCanonicalLocales(e.target.value)[0];
      const index = languageState.langs.indexOf(newLang);
      if (index === -1) {
        languageState.langs.push(newLang);
      } else {
        languageState.langs.unshift(languageState.langs.splice(index, 1)[0]);
      }
      console.log(...languageState.langs);
      e.target.reset();
    } catch (err) {
      console.error(err);
    }
  }),
  options: {
    passive: true,
  },
};

const buttonSetPrimaryLang = {
  handle: (e) => {
    const langIndex = Number.parseInt(e.target.getAttribute('index'));
    if (langIndex === 0) {
      return;
    }
    languageState.langs.unshift(languageState.langs.splice(langIndex, 1)[0]);
  },
  options: {
    passive: true,
  },
};

const Button = ({ children, class: className, ...other }) => (
  <xy-button class={cx(text.h500, className)} {...other}>
    {children}
  </xy-button>
);

const MiscSettings = () => (
  <section>
    <FunctionHeadingH1>Misc</FunctionHeadingH1>
    <Field labelContent="Font size" contentClass={styles.flexAlign}>
      {fontState.size}
      <paper-single-range-slider
        min={9}
        min={72}
        $value={browserFontSize}
        pin={true}
        class={cx(styles.singleSliderHack, styles.sliderContainer)}
        $$immediate-value-change={sliderSetEmSizeFromImmediateValue}
        $$value-change={sliderSetEmSizeFromValue}
      />
    </Field>
    <Field labelContent="Language preferences" contentClass={styles.flexStretch}>
      <xy-input class={styles.editLang} $$submit={addLangPreference} />
      <div
        $$click={buttonSetPrimaryLang}
        class={cx(styles.flexStretch, styles.wrap, styles.langPrefs)}
      >
        <div>
          <Button class={cx(styles.theme, styles.dark)} type="primary" index={0}>
            {languageState.langs[0]}
          </Button>
        </div>
        {languageState.langs.slice(1).map((lang, i) => (
          <div>
            <Button index={i + 1}>{lang}</Button>
          </div>
        ))}
      </div>
    </Field>
  </section>
);

const selectState = observable({
  selectMode: false,
});

autorun(() => {
  if (selectState.selectMode) {
    document.body.style.cursor = 'auto';
  } else {
    document.body.style.cursor = null;
  }
});

const onSelectToggle = {
  handle: action((e) => {
    const isSelected = !e.target.checked;
    selectState.selectMode = isSelected;
  }),
  option: {
    passive: true,
  },
};

const ReplaceWordConfig = () => {
  const min = Math.min(replaceWordState.character.min, CHARACTER_SLIDER_MIN);
  const max = Math.max(replaceWordState.character.max, CHARACTER_SLIDER_MAX);
  return (
    <section>
      <FunctionHeadingH1 class={cx(text.margin, styles.inline)}>
        Replace words
        <Button
          class={cx(styles.rightTextIcon, styles.selectableButton)}
          title="Click or select a region to replace with page-breaking words"
          toggle={true}
          $$click={onSelectToggle}
        >
          <SelectAndDragIcon />
          &nbsp; Select
        </Button>
      </FunctionHeadingH1>
      <Field labelContent="Word length" contentClass={styles.flexAlign}>
        {replaceWordState.character.min}
        <paper-range-slider
          min={min}
          max={max}
          $valueMin={replaceWordState.character.min}
          $valueMax={replaceWordState.character.max}
          $$updateValues={sliderSetMinMaxCharacters}
          class={cx(styles.sliderContainer, styles.rangeSliderHack)}
          pin={true}
        />
        {replaceWordState.character.max}
      </Field>
    </section>
  );
};

const ReplaceWordExample = ({ children }) => {
  return <p class={cx(text.h200, text.margin)}>{children}</p>;
};

const ReplaceWordPreview = () => (
  <section>
    <FunctionConfigSubheadngH1>Preview</FunctionConfigSubheadngH1>
    {previewWords.get().map((word) => (
      <ReplaceWordExample>{word}</ReplaceWordExample>
    ))}
  </section>
);

const ReplaceWidth = () => (
  <section>
    <ReplaceWordConfig />
    <ReplaceWordPreview />
  </section>
);

const App = () => (
  <>
    <header class={cx(styles.appHeader, styles.theme, styles.dark)}>
      <AppHeadingH1>Page breaker</AppHeadingH1>
    </header>
    <main class={cx(styles.appContent, styles.theme, styles.light)}>
      <MiscSettings />
      <ReplaceWidth />
    </main>
  </>
);

const rootElement = document.getElementById('root');

autorun(() => mbx.render(<App />, rootElement));
