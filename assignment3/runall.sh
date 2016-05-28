#!/bin/bash
echo "Generating..."
./template-rt test_result/testAmbient.txt
echo "   + testAmbient.ppm"
./template-rt test_result/testBackground.txt
echo "   + testBackground.ppm"
./template-rt test_result/testBehind.txt
echo "   + testBehind.ppm"
./template-rt test_result/testDiffuse.txt
echo "   + testDiffuse.ppm"
./template-rt test_result/testIllum.txt
echo "   + testIllum.ppm"
./template-rt test_result/testIntersection.txt
echo "   + testIntersection.ppm"
./template-rt test_result/testParsing.txt
echo "   + testParsing.ppm"
./template-rt test_result/testReflection.txt
echo "   + testReflection.ppm"
./template-rt test_result/testSample.txt
echo "   + testSample.ppm"
./template-rt test_result/testShadow.txt
echo "   + testShadow.ppm"
./template-rt test_result/testSpecular.txt
echo "   + testSpecular.ppm"

echo "Finished"