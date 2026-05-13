import React from 'react';
import { Svg, Polygon, Polyline, View, Text, StyleSheet } from '@react-pdf/renderer';

/**
 * Marca Recursalia reconstruida como SVG nativo para `@react-pdf/renderer`.
 *
 * Dos componentes:
 *  - `RecursaliaMark`: solo el hexágono + chevron (símbolo).
 *  - `RecursaliaLockup`: símbolo + wordmark "Recursalia" en un row, colores
 *    parametrizables (versión azul/negro sobre fondo claro, versión lima/blanco
 *    sobre fondo oscuro, etc.).
 *
 * Coordenadas calibradas sobre un viewBox 64×64 con centro (32, 32). El
 * hexágono es regular en orientación vertical (vértices arriba y abajo). El
 * stroke se mantiene en `markStrokeWidth` para que el icono "respire" igual a
 * distintos tamaños.
 */

export const BRAND_BLUE = '#1b38c4';
export const BRAND_INK = '#0a0d1f';
export const BRAND_LIME = '#c6f04d';

interface RecursaliaMarkProps {
  /** Tamaño en pt del cuadrado contenedor del símbolo. */
  size?: number;
  /** Color del trazo (hexágono + chevron). */
  color?: string;
  /** Grosor del trazo (sobre el viewBox 64). */
  strokeWidth?: number;
}

export function RecursaliaMark({
  size = 24,
  color = BRAND_BLUE,
  strokeWidth = 4.5,
}: RecursaliaMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Polygon
        points="32,5 55.4,18.5 55.4,45.5 32,59 8.6,45.5 8.6,18.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill="none"
      />
      <Polyline
        points="21,28 32,38 43,28"
        stroke={color}
        strokeWidth={strokeWidth - 0.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

interface RecursaliaLockupProps {
  /** Altura total del lockup en pt (el ancho se calcula). */
  height?: number;
  /** Color del símbolo (hexágono + chevron). */
  markColor?: string;
  /** Color del wordmark "Recursalia". */
  wordmarkColor?: string;
}

const lockupStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: 'Helvetica-Bold',
    letterSpacing: -0.2,
  },
});

export function RecursaliaLockup({
  height = 28,
  markColor = BRAND_BLUE,
  wordmarkColor = BRAND_INK,
}: RecursaliaLockupProps) {
  const markSize = height;
  const wordSize = height * 0.78;
  const gap = height * 0.32;
  return (
    <View style={lockupStyles.row}>
      <RecursaliaMark size={markSize} color={markColor} />
      <Text
        style={[
          lockupStyles.wordmark,
          { fontSize: wordSize, color: wordmarkColor, marginLeft: gap },
        ]}
      >
        Recursalia
      </Text>
    </View>
  );
}
