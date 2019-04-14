import React, { SVGAttributes } from 'react';
import { Icon } from './icon';

type Props = SVGAttributes<SVGSVGElement>;

export const CheckIcon = (props: Props) => (
  <Icon viewBox="0 0 448 512" {...props}>
    <path d="M413.505 91.951L133.49 371.966l-98.995-98.995c-4.686-4.686-12.284-4.686-16.971 0L6.211 284.284c-4.686 4.686-4.686 12.284 0 16.971l118.794 118.794c4.686 4.686 12.284 4.686 16.971 0l299.813-299.813c4.686-4.686 4.686-12.284 0-16.971l-11.314-11.314c-4.686-4.686-12.284-4.686-16.97 0z" />
  </Icon>
);
