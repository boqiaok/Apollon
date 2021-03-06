import { all, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { ModelState } from '../../components/store/model-state';
import { Container } from '../container/container';
import { DiagramRepository } from '../diagram/diagram-repository';
import { RelationshipRepository } from '../relationship/relationship-repository';
import { Element, IElement } from './element';
import { ElementRepository } from './element-repository';
import {
  DeleteAction,
  DuplicateAction,
  ElementActionTypes,
  HoverAction,
  LeaveAction,
  MakeInteractiveAction,
  MoveAction,
  SelectAction,
  UpdateAction,
} from './element-types';

export function* ElementSaga() {
  yield takeEvery(ElementActionTypes.DUPLICATE, handleElementDuplicate);
  yield takeLatest(ElementActionTypes.HOVER, handleElementHover);
  yield takeLatest(ElementActionTypes.LEAVE, handleElementLeave);
  yield takeLatest(ElementActionTypes.SELECT, handleElementSelect);
  yield takeLatest(ElementActionTypes.MAKE_INTERACTIVE, handleElementMakeInteractive);
  yield takeEvery(ElementActionTypes.MOVE, handleElementMove);
  yield takeLatest(ElementActionTypes.DELETE, handleElementDelete);
}

function* handleElementDuplicate({ payload }: DuplicateAction) {
  const { id, parent } = payload;
  const { elements }: ModelState = yield select();
  const element = ElementRepository.getById(elements)(id);
  if (!element) return;

  const clone = element.clone();
  if (parent) {
    clone.owner = parent;
  } else {
    clone.bounds.x += 30;
    clone.bounds.y += 30;
  }

  let ownedElements: string[] = [];
  if (clone instanceof Container) {
    ownedElements = clone.ownedElements;
    clone.ownedElements = [];
  }

  yield all([put(ElementRepository.select(null)), put(ElementRepository.create(clone))]);

  for (const ownedElement of ownedElements) {
    yield put(ElementRepository.duplicate(ownedElement, clone.id));
  }

  if (!parent) {
    yield put(ElementRepository.select(clone.id));
  }
}

function* handleElementHover({ payload }: HoverAction) {
  if (payload.internal) return;
  const { elements }: ModelState = yield select();
  const element: IElement = elements[payload.id];
  if (element.owner) {
    yield put(ElementRepository.leave(element.owner, true));
  }
}

function* handleElementLeave({ payload }: LeaveAction) {
  if (payload.internal) return;
  const { elements }: ModelState = yield select();
  const element = elements[payload.id];
  if (element.owner) {
    yield put(ElementRepository.hover(element.owner, true));
  }
}

function* handleElementSelect({ payload }: SelectAction) {
  if (payload.toggle || payload.keep) return;
  const { elements }: ModelState = yield select();
  const selection = Object.values(elements).filter(element => element.selected && element.id !== payload.id);
  yield all(selection.map(element => put(ElementRepository.select(element.id, true))));
}

function* handleElementMakeInteractive({ payload }: MakeInteractiveAction) {
  const { elements }: ModelState = yield select();

  const relationship = RelationshipRepository.getById(elements)(payload.id);
  if (relationship) {
    yield put<UpdateAction>(ElementRepository.update(relationship.id, { interactive: !relationship.interactive }));
    return;
  }

  const current = ElementRepository.getById(elements)(payload.id);
  if (!current) return;

  const update = (id: string, interactive: boolean) => put<UpdateAction>(ElementRepository.update(id, { interactive }));

  let owner = current.owner;
  while (owner) {
    const element = elements[owner];
    if (element.interactive) {
      yield update(element.id, false);
      return;
    }
    owner = element.owner;
  }

  yield update(current.id, !current.interactive);

  if (current instanceof Container) {
    const rec = (id: string): Array<ReturnType<typeof update>> => {
      const child = ElementRepository.getById(elements)(id);
      if (!child) return [];
      if (child.interactive) {
        return [update(child.id, false)];
      }
      if (child instanceof Container) {
        return child.ownedElements.reduce<Array<ReturnType<typeof update>>>((a, o) => {
          return [...a, ...rec(o)];
        }, []);
      }
      return [];
    };

    const t = current.ownedElements.reduce<Array<ReturnType<typeof update>>>((a, o) => [...a, ...rec(o)], []);
    yield all(t);
  }
}

function* handleElementMove({ payload }: MoveAction) {
  if (payload.id) return;
  const state: ModelState = yield select();
  const diagram = DiagramRepository.read(state);
  const elements = ElementRepository.parse(state);

  const getSelection = (container: Container): Element[] => {
    if (container.selected) return [container];

    return container.ownedElements.reduce<Element[]>((result, id) => {
      const element = elements[id];
      if (!element) return result;
      if (element.selected) return [...result, element];
      if (element instanceof Container) return [...result, ...getSelection(element)];
      return result;
    }, []);
  };
  yield all(getSelection(diagram).map(element => put(ElementRepository.move(element.id, payload.delta))));
}

function* handleElementDelete({ payload }: DeleteAction) {
  if (payload.id) return;

  const { elements }: ModelState = yield select();
  const selection = Object.values(elements).filter(element => element.selected && element.id !== payload.id);
  yield all(selection.map(element => put(ElementRepository.delete(element.id))));
}
