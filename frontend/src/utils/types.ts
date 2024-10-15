import { IAction } from 'edifice-ts-client';

/**
 * Definition of an action the user may accomplish,
 * if he owns the required (workflow/resource) rights.
 */
export type IActionDefinition = Omit<IAction, 'available'>;
