import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { AppDispatchType, RootStateType } from "./store";

const useAppDispatch = useDispatch.withTypes<AppDispatchType>();
const useAppSelector: TypedUseSelectorHook<RootStateType> = useSelector;

export { useAppDispatch, useAppSelector };
