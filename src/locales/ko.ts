/**
 * Korean chrome strings — `import '@iyulab/u-widgets/locales/ko'` registers them as `ko`, so a widget
 * whose locale is `ko` or `ko-KR` (its own `locale`, `setDefaultLocale()`, or `<html lang>`) speaks
 * Korean. The table is typed as complete: a string added to the locale is a type error here until it
 * is translated, so it never silently stays English.
 */
import { registerLocale, type UWidgetLocaleStrings } from '../core/locale.js';

export const ko: UWidgetLocaleStrings = {
  // UI chrome — table pagination
  prev: '이전',
  next: '다음',
  searchPlaceholder: '검색...',

  // ARIA labels — table
  searchTable: '표 검색',
  previousPage: '이전 페이지',
  nextPage: '다음 페이지',
  tablePagination: '표 페이지 이동',
  dataTable: '데이터 표',
  opensInNewTab: '(새 탭에서 열림)',

  // Validation messages — form
  required: '{label}을(를) 입력하세요',
  minLength: '{label}은(는) {min}자 이상이어야 합니다',
  maxLength: '{label}은(는) {max}자 이하여야 합니다',
  minValue: '{label}은(는) {min} 이상이어야 합니다',
  maxValue: '{label}은(는) {max} 이하여야 합니다',
  invalidEmail: '{label}에 올바른 이메일 주소를 입력하세요',
  invalidUrl: '{label}에 올바른 URL을 입력하세요',
  invalidPattern: '{label} 형식이 올바르지 않습니다',

  // Accessible names of widget regions
  actions: '동작',
  citations: '인용',
  gallery: '갤러리',
  keyValuePairs: '키-값 목록',
  status: '상태',
  steps: '단계',
  ratingOutOf: '평점: {max}점 중 {value}점',

  // Code block
  code: '코드',
  copy: '복사',
  copied: '복사됨',

  // Fallback cards
  moduleNotLoaded: '위젯 모듈을 불러오지 않았습니다: {widget}',
  unknownWidget: '알 수 없는 위젯: {widget}',
  addImportHint: '이 위젯을 그리려면 {import}을(를) 추가하세요.',
  didYouMean: '{suggestion}을(를) 찾으셨나요?',
  invalidSpec: '잘못된 위젯 명세',
  specErrorNotObject: '명세는 null이 아닌 객체여야 합니다',
  specErrorTooDeep: 'compose 자식이 최대 중첩 깊이({max})를 넘었습니다',
  specErrorWidgetRequired: '필수 필드 "widget"은 비어 있지 않은 문자열이어야 합니다',
  specErrorTypeInvalid: '"type"을 쓴다면 "u-widget"이어야 합니다',
  specErrorFieldsFormdownExclusive: '"fields"와 "formdown"은 함께 쓸 수 없습니다',
  specErrorDataNotArray: '"{widget}"의 "data"는 배열이어야 하는데 받은 값은 {got}입니다',
  specErrorDataNotObject: '"{widget}"의 "data"는 객체여야 하는데 받은 값은 {got}입니다',
  specErrorChildrenRequired: '"compose" 위젯에는 "children" 배열이 필요합니다',
  specErrorChildInvalid: 'children[{index}]는 "widget" 필드가 있는 객체여야 합니다',
  specErrorLayoutInvalid: '"layout"은 다음 중 하나여야 합니다: {options}',
  specErrorFieldInvalid: 'fields[{index}]에는 문자열 "field" 속성이 있어야 합니다',
  specErrorActionInvalid: 'actions[{index}]에는 문자열 "label"과 "action" 속성이 있어야 합니다',
};

registerLocale('ko', ko);
