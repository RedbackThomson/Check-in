import { TESCEvent } from '@Shared/ModelTypes';
import React from 'react';

import { Props } from '../index';

interface EventPageTabProps {
  event: TESCEvent;
}

export default class EventPageTab<P, S = {}> extends React.Component<P & EventPageTabProps & Props, S> {
}
