/* Modified by coolssor */

// Importing the `extensionInstance` object from the `extension.js` file.
// This is likely used to access shared settings or functionality provided by the extension.
import { extensionInstance } from './extension.js';

// Declaring a global object `g` with a property `mmPanel` initialized as an empty array.
// This object is likely used to store global state or shared data for the application.
export var g = {
    mmPanel: []
};

// Function to retrieve a boolean setting based on a given `classId`.
// `classId` is expected to be a key for a setting, and the function returns its boolean value.
export function unhideClass(classId) {
    // Access the settings through `extensionInstance` and retrieve the boolean value for `classId`.
    let tmp = extensionInstance.getSettings().get_boolean(classId);
    return tmp; // Return the retrieved boolean value.
}

// Function to copy methods and properties from one class or object (`s`) to another (`d`).
// This is useful for extending or augmenting the functionality of an object or class.
export function copyClass(s, d) {
    // If the source object (`s`) is undefined, log an error and exit the function.
    if (!s) {
        console.error(`copyClass s undefined for d ${d.name}`)
        return
    }

    // Get the prototype of the source object (`s`).
    // If `s` has a `prototype` property, use it; otherwise, use `Object.getPrototypeOf(s)`.
    let prototype = s.prototype ? s.prototype : Object.getPrototypeOf(s);

    // Retrieve all property names (including symbols) from the prototype of `s`.
    let propertyNames = Reflect.ownKeys(prototype);

    // Iterate over each property name in the prototype.
    for (let pName of propertyNames.values()) {
        // Skip symbols, as they are not standard property names.
        if (typeof pName === "symbol") continue;

        // Skip properties that already exist in the prototype of the destination object (`d`).
        if (Object.prototype.hasOwnProperty.call(d.prototype, pName)) continue;

        // Skip the `prototype` and `constructor` properties, as they are special and should not be copied.
        if (pName === "prototype") continue;
        if (pName === "constructor") continue;

        // Get the property descriptor for the current property name from the source prototype.
        let pDesc = Reflect.getOwnPropertyDescriptor(prototype, pName);

        // Skip properties that do not have a valid descriptor object.
        if (typeof pDesc !== 'object') continue;

        // Define the property on the prototype of the destination object (`d`) using the descriptor from `s`.
        Reflect.defineProperty(d.prototype, pName, pDesc);
    }
};