#!/bin/bash
echo "Generating..."
./raytrace test_result/testAmbient.txt
echo "   + testAmbient.ppm"
./raytrace test_result/testBackground.txt
echo "   + testBackground.ppm"
./raytrace test_result/testBehind.txt
echo "   + testBehind.ppm"
./raytrace test_result/testDiffuse.txt
echo "   + testDiffuse.ppm"
./raytrace test_result/testIllum.txt
echo "   + testIllum.ppm"
./raytrace test_result/testIntersection.txt
echo "   + testIntersection.ppm"
./raytrace test_result/testParsing.txt
echo "   + testParsing.ppm"
./raytrace test_result/testReflection.txt
echo "   + testReflection.ppm"
./raytrace test_result/testSample.txt
echo "   + testSample.ppm"
./raytrace test_result/testShadow.txt
echo "   + testShadow.ppm"
./raytrace test_result/testSpecular.txt
echo "   + testSpecular.ppm"

echo "Finished"