import { useCallback, useEffect, useMemo, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  atomFamilyCategories,
  atomToDoAdderCurrentCategory,
  atomFamilyToDos,
  ToDoData,
} from "@/atoms";
import { generateUniqueRandomId } from "@/utils";
import { styled } from "styled-components";
import { Select, SelectHandle, SelectProps } from "@/components/Select";
import { ButtonPrimary } from "@/components/ButtonPrimary";
import { RequiredDeep } from "@/utils/typescriptUtils";

export interface ToDoFormData {
  toDoText: string;
}

const ToDoAdderBase = styled.form`
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 10px;
`;

const ToDoAdderCategorySelector = styled(Select)`
  width: 234px;
`;

const ToDoAdderTextInput = styled.textarea`
  height: 80px;
  width: min(400px, 100%);
  padding: calc(1px + 1px) 5px;
  border: none;
  border-radius: 0;

  font-size: 17px;
  font-family: "Source Sans 3";
  color: #333;

  &::placeholder {
    color: #999;
  }

  &[disabled] {
    background-color: #ddd;
    color: #999;
    cursor: not-allowed;
    resize: none;
  }
`;

const ToDoAdderErrorMessage = styled.div`
  padding-left: 5px;
  color: red;
`;

export function ToDoAdder() {
  const refToDoAdderCategorySelector = useRef<SelectHandle>(null);

  const stateCategories = useRecoilValue(atomFamilyCategories(null));
  const setStateToDos = useSetRecoilState(atomFamilyToDos(null));
  const [stateCurrentCategory, setStateCurrentCategory] = useRecoilState(
    atomToDoAdderCurrentCategory,
  );
  // console.log(stateCurrentCategory);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ToDoFormData>({
    defaultValues: {
      toDoText: "",
    },
  });

  const onValid: SubmitHandler<ToDoFormData> = useCallback(
    ({ toDoText }) => {
      reset({ toDoText: "" });

      if (!stateCurrentCategory) {
        return;
      }

      const id = generateUniqueRandomId();
      setStateToDos((cur) => {
        const newToDo = {
          id,
          category: stateCurrentCategory,
          text: toDoText,
        } satisfies ToDoData;
        return {
          ...cur,
          [stateCurrentCategory]: [
            ...(cur[stateCurrentCategory] ?? []),
            newToDo,
          ],
        };
      });
    },
    [reset, setStateToDos, stateCurrentCategory],
  );

  const submitHandler = useMemo(() => {
    return handleSubmit(onValid);
  }, [handleSubmit, onValid]);

  const selectCategoryHandler = useCallback<
    RequiredDeep<SelectProps>["customProps"]["selectProps"]["onChange"]
  >(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (value: string, option) => {
      setStateCurrentCategory(value);
    },
    [setStateCurrentCategory],
  );

  const pureCategories = stateCategories.filter(
    (stateCategory) => stateCategory !== "All",
  );

  useEffect(() => {
    // console.log(refToDoAdderCategorySelector.current?.selectedValue);
    if (
      refToDoAdderCategorySelector.current?.selectedValue &&
      !pureCategories.includes(
        refToDoAdderCategorySelector.current.selectedValue,
      )
    ) {
      refToDoAdderCategorySelector.current.clear();
    }
  });

  // console.log(pureCategories);

  return (
    <ToDoAdderBase onSubmit={submitHandler}>
      <ToDoAdderCategorySelector
        ref={refToDoAdderCategorySelector}
        customProps={{
          selectProps: {
            disabled: pureCategories.length === 0,
            placeholder: "Select a Category",
            defaultValue: stateCurrentCategory,
            value: stateCurrentCategory,
            options: pureCategories.map((pureCategory) => {
              return {
                value: pureCategory,
                label: pureCategory,
              };
            }),
            onSelect: selectCategoryHandler,
          },
        }}
      />
      <ToDoAdderTextInput
        placeholder="New To-do"
        disabled={stateCurrentCategory === undefined}
        {...register("toDoText", {
          required: "Please fill in a new to-do.",
          validate: {
            checkCategorySelectorNotEmpty: () => {
              return (
                !!refToDoAdderCategorySelector.current?.selectedValue ||
                "Please select a category."
              );
            },
          },
        })}
      />
      <ButtonPrimary
        disabled={
          stateCurrentCategory === undefined &&
          !!refToDoAdderCategorySelector.current?.selectedValue
        }
        type="submit"
      >
        Add
      </ButtonPrimary>
      {!!errors.toDoText?.message && (
        <ToDoAdderErrorMessage>{errors.toDoText.message}</ToDoAdderErrorMessage>
      )}
    </ToDoAdderBase>
  );
}
