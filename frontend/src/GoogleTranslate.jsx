import React from "react";
import { useTranslation } from "react-i18next";

const GoogleTranslate = () => {
  const { i18n } = useTranslation();
  return (
    <select
      value={i18n.language}
      onChange={e => i18n.changeLanguage(e.target.value)}
      style={{
        marginLeft: "10px",
        padding: "8px",
        fontSize: "16px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        background: "white",
        cursor: "pointer",
      }}
    >
      <option value="en">English</option>
      <option value="hi">हिन्दी</option>
      <option value="te">తెలుగు</option>
      <option value="ta">தமிழ்</option>
    </select>
  );
};

export default GoogleTranslate;
