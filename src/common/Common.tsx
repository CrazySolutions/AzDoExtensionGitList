import "azure-devops-ui/Core/override.css";
import * as React from "react";
import * as ReactDOM from "react-dom";
import "./styles.css";

export function showRootComponent(component: React.ReactElement<any>) {
    ReactDOM.render(component, document.getElementById("root"));
}