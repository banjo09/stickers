export interface IInput {
  id?: string;
  placeholder: string;
  background?: string;
  required?: boolean;
  type?: React.HTMLInputTypeAttribute | undefined;
  disabled?: boolean;
  name: string;
  value?: string | number | readonly string[] | undefined | any;
  values?: any;
  onChange?: React.ChangeEventHandler<HTMLInputElement> | undefined;
  handleClick?: () => void;
  errorMessage?: string | any;
  showMessage?: boolean;
  color?: string;
  borderRadius?: string;
  border?: string;
  isPrice?: boolean;
  hideCaret?: boolean;
  isNumericFormat?: boolean;
  setFieldValue?: any;
  hasDropdown?: boolean;
  width?: string;
  _focus?: string;
}

export interface ISelect extends React.HTMLAttributes<HTMLSelectElement> {
  placeholder: string;
  items: Array<{ text: string | number; value: any }>;
  handleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  background?: string;
  type?: React.HTMLInputTypeAttribute | undefined;
  disabled?: boolean;
  name: string;
  value?: string | number | readonly string[] | undefined;
  values?: any;
  errorMessage?: any;
  showMessage?: boolean;
  color?: string;
  borderRadius?: string;
  border?: string;
}