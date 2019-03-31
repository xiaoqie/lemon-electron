import type { GetState, Dispatch } from '../reducers/types';

export const LIST_SORT = "LIST_SORT";
export const LIST_RESIZE = "LIST_RESIZE";
export const LIST_SELECT = "LIST_SELECT";

export const listSortClick = newCol => (dispatch: Dispatch, getState: GetState) => {
    const {list} = getState();
    const {sort} = list;
    const {col, reverse} = sort;
    if (col !== newCol) {
        dispatch({
            type: LIST_SORT,
            payload: {
                col: newCol,
                reverse: true
            }
        });
    } else {
        dispatch({
            type: LIST_SORT,
            payload: {
                col: newCol,
                reverse: !reverse
            }
        });
    }
};

export const listColResize = (i, width) => (dispatch: Dispatch, getState: GetState) => {
    const {list} = getState();
    const {layout} = list;

    const l = JSON.parse(JSON.stringify(layout));
    l[i].width = width;

    dispatch({
        type: LIST_RESIZE,
        payload: l
    })
};

export const listSelect = pid => dispatch => {
    dispatch({
        type: LIST_SELECT,
        payload: pid
    })
}

