import { Property } from "csstype";
import { FC } from "react";
import "./input.css";

type BasicInputProps = {
  name?: string;
  value: string;
  placeholder: string;
  onChange: React.ChangeEventHandler<HTMLInputElement> | undefined;
  errorText?: string;
  color?: string;
  fontSize?: string;
  width?: any;
  borderBottomColor?: string;
  className?: string;
  textAlign?: Property.TextAlign;
  blur?: () => void;
};

const BasicInput: FC<BasicInputProps> = ({
  name,
  value,
  placeholder,
  textAlign,
  onChange,
  errorText,
  color,
  fontSize,
  borderBottomColor,
  className,
  width,
  blur,
}) => {
  return (
    <div
      style={{
        width: '100%'
      }}
    >
      <label style={{ color: color ?? "#fff" }}>{name}</label>
      <input
        // bg={"transparent"}
        name={name}
        style={{
          color,
          fontSize: fontSize ?? "16px",
          textAlign,
          width,
          borderBottom: errorText ? "1px solid #FF2222" : `1px solid ${borderBottomColor}`,
        }}
        placeholder={placeholder}
        value={value}
        className={`custom-input ${className}`}
        onChange={onChange}
        onBlur={blur}
      />
      {errorText && (
        <label style={{ color: "#FF2222", fontSize: "16px" }}>
          {errorText}
        </label>
      )}
    </div>
  );
};

export default BasicInput;
