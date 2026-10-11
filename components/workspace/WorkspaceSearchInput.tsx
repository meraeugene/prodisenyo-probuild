import type { InputHTMLAttributes } from "react";
import styles from "./workspace.module.css";

export default function WorkspaceSearchInput({ className = styles.control, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} type="search" data-search-field="true" className={className} />;
}
