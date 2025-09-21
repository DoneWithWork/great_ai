import * as React from "react";

declare global {
    namespace JSX {
        interface IntrinsicElements extends React.JSX.IntrinsicElements { }
        interface Element extends React.JSX.Element { }
        interface ElementClass extends React.JSX.ElementClass { }
        interface ElementAttributesProperty extends React.JSX.ElementAttributesProperty { }
        interface ElementChildrenAttribute extends React.JSX.ElementChildrenAttribute { }
    }
}
